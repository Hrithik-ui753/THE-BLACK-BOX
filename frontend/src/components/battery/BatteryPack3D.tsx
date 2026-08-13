import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Battery, CellStatus } from '@/types'
import { STATUS_COLOR } from '@/constants/status'
import { useAppStore } from '@/store/useAppStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const CELL_R = 0.52
const CELL_H = 1.9
const COLS = [-1.55, 0, 1.55]
const CELL_POSITIONS: THREE.Vector3[] = COLS.map((x) => new THREE.Vector3(x, CELL_H / 2, 0))

const SERIES_ORDER = [0, 1, 2] // cell indices (0-based) in electrical series (3-Cell 3S Pack)
const DEFAULT_TARGET = new THREE.Vector3(0, 1.0, 0)
const PARTICLE_COUNT = 24

function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(56,189,248,0.55)')
  g.addColorStop(0.35, 'rgba(56,189,248,0.18)')
  g.addColorStop(1, 'rgba(56,189,248,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

function makeHazeTexture(color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 60)
  g.addColorStop(0, color)
  g.addColorStop(0.55, color.replace('0.35', '0.12'))
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

// ————— Cell mesh with dynamic 3D voltage & status color updates —————
const Cell = memo(function Cell({
  index,
  batteryId,
  position,
  onSelect,
}: {
  index: number
  batteryId: string
  position: THREE.Vector3
  onSelect: (i: number) => void
}) {
  const capRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const reduced = useReducedMotion()
  const color = useRef(new THREE.Color('#10b981'))

  const [cellInfo, setCellInfo] = useState<{
    voltage: number
    temperature: number
    status: CellStatus
  }>({
    voltage: index === 1 ? 3.799 : index === 2 ? 3.555 : 3.391,
    temperature: 27.14,
    status: 'healthy',
  })

  useFrame(({ clock }) => {
    const st = useAppStore.getState()
    const targetId = batteryId || st.selectedBatteryId || '164de9f0-62ee-411a-b8b9-a73eb2406f97'
    const pack =
      st.telemetry[targetId] ||
      st.telemetry['164de9f0-62ee-411a-b8b9-a73eb2406f97'] ||
      st.telemetry['battery-01'] ||
      Object.values(st.telemetry)[0]

    const cell = pack?.cells.find((c) => c.index === index)
    const v = cell?.voltage ?? (index === 1 ? 3.799 : index === 2 ? 3.555 : 3.391)
    const temp = cell?.temperature ?? 27.14
    const isRemoved = cell?.status === 'CELL_REMOVED' || cell?.mlSkipped || v <= 0.15
    const status: CellStatus = isRemoved
      ? 'CELL_REMOVED'
      : v <= 2.5
      ? 'critical'
      : v < 3.0 || cell?.status === 'warning'
      ? 'warning'
      : 'healthy'

    if (
      cellInfo.voltage !== v ||
      cellInfo.temperature !== temp ||
      cellInfo.status !== status
    ) {
      setCellInfo({ voltage: v, temperature: temp, status })
    }

    const hexColor = STATUS_COLOR[status] ?? '#10b981'
    color.current.set(hexColor)
    const t = clock.elapsedTime
    const pulse = 0.55 + Math.sin(t * 1.6 + index) * (status === 'healthy' ? 0.14 : 0.28)

    // Dynamic 3D Cylinder Material Color & Emissive Lerp
    if (bodyRef.current) {
      const bm = bodyRef.current.material as THREE.MeshStandardMaterial
      const bodyBaseHex =
        status === 'critical'
          ? '#7f1d1d'
          : status === 'warning'
          ? '#78350f'
          : status === 'CELL_REMOVED'
          ? '#334155'
          : '#064e3b'
      bm.color.lerp(new THREE.Color(bodyBaseHex), 0.1)
      bm.emissive.lerp(color.current, 0.1)
      bm.emissiveIntensity =
        status === 'healthy' ? 0.15 : status === 'warning' ? 0.35 : status === 'critical' ? 0.65 : 0.2
    }

    if (capRef.current) {
      const m = capRef.current.material as THREE.MeshStandardMaterial
      m.emissive.lerp(color.current, 0.1)
      m.emissiveIntensity = reduced ? 0.5 : pulse
    }

    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshStandardMaterial
      m.emissive.lerp(color.current, 0.1)
      m.emissiveIntensity = reduced ? 0.7 : 0.9 + Math.sin(t * 2.0 + index) * 0.25
    }

    if (bodyRef.current && !reduced) {
      const s = 1 + Math.sin(t * 1.4 + index * 1.7) * (status === 'critical' ? 0.018 : 0.006)
      bodyRef.current.scale.setScalar(s)
    }
  })

  const statusBg =
    cellInfo.status === 'healthy'
      ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300'
      : cellInfo.status === 'warning'
      ? 'border-amber-500/40 bg-amber-950/80 text-amber-300'
      : cellInfo.status === 'critical'
      ? 'border-red-500/40 bg-red-950/80 text-red-300'
      : 'border-slate-500/40 bg-slate-900/80 text-slate-400'

  return (
    <group position={position}>
      {/* Cell Body Cylinder */}
      <mesh ref={bodyRef} onClick={(e) => { e.stopPropagation(); onSelect(index) }} castShadow>
        <cylinderGeometry args={[CELL_R, CELL_R, CELL_H, 32]} />
        <meshStandardMaterial color="#064e3b" emissive="#10b981" emissiveIntensity={0.15} metalness={0.65} roughness={0.25} />
      </mesh>

      {/* Terminal Cap */}
      <mesh position={[0, CELL_H / 2 + 0.03, 0]} onClick={(e) => { e.stopPropagation(); onSelect(index) }}>
        <cylinderGeometry args={[0.34, 0.34, 0.06, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* LED Emissive Glow Indicator */}
      <mesh ref={capRef} position={[0, CELL_H / 2 + 0.03, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.012, 24]} />
        <meshStandardMaterial color="#020617" emissive="#10b981" emissiveIntensity={0.6} />
      </mesh>

      {/* Outer Status Ring */}
      <mesh ref={ringRef} position={[0, CELL_H / 2 + 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.39, 0.03, 12, 32]} />
        <meshStandardMaterial color="#020617" emissive="#10b981" emissiveIntensity={0.85} transparent opacity={0.9} />
      </mesh>

      {/* Dynamic 3D Html Overlay Readout */}
      <Html position={[0, CELL_H / 2 + 0.5, 0]} center distanceFactor={8} style={{ pointerEvents: 'none', zIndex: 10 }}>
        <div className={`flex flex-col items-center rounded-xl border px-3 py-1.5 backdrop-blur-md shadow-lg text-center min-w-[76px] transition-all ${statusBg}`}>
          <div className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full status-dot-pulse ${cellInfo.status === 'healthy' ? 'bg-emerald-400' : cellInfo.status === 'warning' ? 'bg-amber-400' : cellInfo.status === 'critical' ? 'bg-red-400' : 'bg-slate-400'}`} />
            <span className="text-[10px] font-black tracking-wider uppercase">
              CELL 0{index}
            </span>
          </div>
          <div className="text-xs font-black tabular-nums tracking-tight mt-0.5">
            {cellInfo.status === 'CELL_REMOVED' ? 'REMOVED' : `${cellInfo.voltage.toFixed(2)} V`}
          </div>
          <div className="text-[9px] font-bold opacity-85 mt-0.5">
            {cellInfo.temperature.toFixed(1)}°C
          </div>
        </div>
      </Html>
    </group>
  )
})

// ————— Energy particles —————
function EnergyFlow({ batteryId }: { batteryId: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const phases = useRef<number[]>(Array.from({ length: PARTICLE_COUNT }, (_, i) => i / PARTICLE_COUNT))
  const dirRef = useRef(1)
  const colorRef = useRef(new THREE.Color('#38bdf8'))
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const reduced = useReducedMotion()

  const curve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-2.45, 1.75, 0), // terminal −
      ...SERIES_ORDER.map((i) => CELL_POSITIONS[i].clone().setY(CELL_H + 0.14)),
      new THREE.Vector3(2.45, 0.15, 0), // terminal +
    ]
    return new THREE.CatmullRomCurve3(pts, true)
  }, [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const st = useAppStore.getState()
    const targetId = batteryId || st.selectedBatteryId || '164de9f0-62ee-411a-b8b9-a73eb2406f97'
    const pack =
      st.telemetry[targetId] ||
      st.telemetry['164de9f0-62ee-411a-b8b9-a73eb2406f97'] ||
      st.telemetry['battery-01'] ||
      Object.values(st.telemetry)[0]

    const charging = pack?.chargeState === 'charging'
    const status = pack?.status ?? 'healthy'
    const targetDir = charging ? 1 : -1
    dirRef.current += (targetDir - dirRef.current) * 0.05

    const flowColorHex =
      status === 'critical'
        ? '#ef4444'
        : status === 'warning'
        ? '#f59e0b'
        : charging
        ? '#38bdf8'
        : '#34d399'

    colorRef.current.lerp(new THREE.Color(flowColorHex), 0.05)

    const speed = reduced ? 0.004 : 1
    const dt = 0.16
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      phases.current[i] = (phases.current[i] + dirRef.current * dt * 0.02 * speed + dt * 0.0008) % 1
      const p = curve.getPointAt(Math.abs(phases.current[i]))
      dummy.position.copy(p)
      dummy.scale.setScalar(0.7 + 0.3 * Math.sin(clock.elapsedTime * 3 + i))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, colorRef.current)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

// ————— Bus bars between 3 cells —————
function BusBars() {
  const segments = useMemo(() => {
    const pts = SERIES_ORDER.map((i) => CELL_POSITIONS[i].clone().setY(CELL_H + 0.07))
    const out: Array<{ a: THREE.Vector3; b: THREE.Vector3 }> = []
    for (let i = 0; i < pts.length - 1; i++) out.push({ a: pts[i], b: pts[i + 1] })
    out.push({
      a: new THREE.Vector3(pts[0].x, pts[0].y, 0),
      b: new THREE.Vector3(-2.3, 1.78, 0),
    })
    out.push({
      a: new THREE.Vector3(pts[pts.length - 1].x, 0.15, 0),
      b: new THREE.Vector3(2.3, 0.15, 0),
    })
    return out
  }, [])
  const up = new THREE.Vector3(0, 1, 0)
  return (
    <>
      {segments.map(({ a, b }, i) => {
        const dir = b.clone().sub(a)
        const len = dir.length()
        const center = a.clone().add(b).multiplyScalar(0.5)
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())
        return (
          <mesh key={i} position={center} quaternion={quat}>
            <boxGeometry args={[0.16, len, 0.12]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
          </mesh>
        )
      })}
    </>
  )
}

// ————— SOC energy bar —————
function SocBar({ batteryId }: { batteryId: string }) {
  const fillRef = useRef<THREE.Mesh>(null)
  const [socPct, setSocPct] = useState(85)

  useFrame(() => {
    const st = useAppStore.getState()
    const targetId = batteryId || st.selectedBatteryId || '164de9f0-62ee-411a-b8b9-a73eb2406f97'
    const pack =
      st.telemetry[targetId] ||
      st.telemetry['164de9f0-62ee-411a-b8b9-a73eb2406f97'] ||
      st.telemetry['battery-01'] ||
      Object.values(st.telemetry)[0]

    const val = pack?.soc ?? 85
    const target = val / 100
    if (fillRef.current) {
      fillRef.current.scale.y += (target - fillRef.current.scale.y) * 0.05
      const fm = fillRef.current.material as THREE.MeshStandardMaterial
      const socColor = val < 20 ? '#ef4444' : val < 40 ? '#f59e0b' : '#38bdf8'
      fm.color.set(socColor)
      fm.emissive.set(socColor)
    }
    if (socPct !== val) setSocPct(val)
  })

  return (
    <group position={[2.75, 0, 0]}>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.2, 2.0, 0.2]} />
        <meshStandardMaterial color="#0e1a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh ref={fillRef} position={[0, 0.14, 0]}>
        <boxGeometry args={[0.12, 1.88, 0.12]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.7} />
      </mesh>
      <Html position={[0, 2.25, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-widest text-faint">SOC</span>
          <span className="text-[10px] font-black text-accent tabular-nums">{socPct.toFixed(0)}%</span>
        </div>
      </Html>
    </group>
  )
}

// ————— Smoke / gas haze —————
function GasHaze({ batteryId }: { batteryId: string }) {
  const sprites = useRef<THREE.Sprite[]>([])
  const hazes = useMemo(
    () => [makeHazeTexture('rgba(251,191,36,0.35)'), makeHazeTexture('rgba(248,113,113,0.35)')],
    [],
  )
  useFrame(({ clock }) => {
    const st = useAppStore.getState()
    const targetId = batteryId || st.selectedBatteryId || '164de9f0-62ee-411a-b8b9-a73eb2406f97'
    const pack =
      st.telemetry[targetId] ||
      st.telemetry['164de9f0-62ee-411a-b8b9-a73eb2406f97'] ||
      st.telemetry['battery-01'] ||
      Object.values(st.telemetry)[0]

    const t = clock.elapsedTime
    pack?.cells.forEach((cell) => {
      const spr = sprites.current[cell.index - 1]
      if (!spr) return
      const gas = cell.gas
      const isCritical = cell.status === 'critical' || cell.voltage <= 2.5
      const colorIdx = isCritical ? 1 : 0
      if (gas <= 8 && !isCritical) {
        spr.visible = false
        return
      }
      spr.visible = true
      spr.material = new THREE.SpriteMaterial({
        map: hazes[colorIdx],
        transparent: true,
        opacity: isCritical ? 0.35 + Math.sin(t * 2.0) * 0.1 : 0.14 + gas * 0.004 + Math.sin(t * 0.8 + cell.index) * 0.02,
        depthWrite: false,
      })
      const base = CELL_POSITIONS[cell.index - 1]
      spr.position.set(base.x + Math.sin(t * 0.5 + cell.index) * 0.06, 2.2 + Math.sin(t * 0.35 + cell.index * 2) * 0.08, base.z)
      const s = 0.8 + gas * 0.02
      spr.scale.set(s, s * 0.8, 1)
    })
  })
  return (
    <>
      {CELL_POSITIONS.map((p, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) sprites.current[i] = el
          }}
          position={[p.x, 2.2, p.z]}
          scale={[0.9, 0.7, 1]}
          visible={false}
        >
          <spriteMaterial map={hazes[0]} transparent opacity={0} depthWrite={false} />
        </sprite>
      ))}
    </>
  )
}

// ————— Scene —————
function PackScene({ battery }: { battery: Battery }) {
  const selectedCellIndex = useAppStore((s) => s.selectedCellIndex)
  const selectCell = useAppStore((s) => s.selectCell)
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const focusRef = useRef<number | null>(null)
  const targetPos = useRef(new THREE.Vector3().copy(DEFAULT_TARGET))
  const [glowTexture] = useState(makeGlowTexture)

  useEffect(() => {
    focusRef.current = selectedCellIndex
  }, [selectedCellIndex])

  useFrame((state, dt) => {
    const c = controlsRef.current
    if (!c) return
    const k = 1 - Math.pow(0.0002, dt)
    const focusPos = focusRef.current != null ? CELL_POSITIONS[focusRef.current - 1].clone().add(new THREE.Vector3(0, 0.15, 0.6)) : DEFAULT_TARGET
    targetPos.current.lerp(focusPos, k)
    c.target.copy(targetPos.current)
    const desired = focusRef.current != null ? 4.8 : 8.2
    const dir = state.camera.position.clone().sub(c.target)
    const dist = dir.length()
    dir.normalize()
    const newDist = dist + (desired - dist) * k
    state.camera.position.copy(c.target.clone().add(dir.multiplyScalar(newDist)))
    c.update()
  })

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 8, 4]} intensity={1.4} />
      <directionalLight position={[-6, 4, -5]} intensity={0.5} color="#38bdf8" />
      <pointLight position={[0, 4, -3]} intensity={0.7} color="#34d399" />
      <fog attach="fog" args={['#020617', 10, 22]} />

      {/* Frosted ground disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Backdrop cyan glow */}
      <sprite position={[0, 1.2, -2.6]} scale={[7, 4, 1]}>
        <spriteMaterial map={glowTexture} transparent opacity={0.35} depthWrite={false} />
      </sprite>

      <group>
        {/* Sleek 3-Cell Chassis Base */}
        <mesh position={[0, 1.15, -1.0]}>
          <boxGeometry args={[4.4, 2.3, 0.12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[4.4, 0.12, 1.8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.55} roughness={0.3} />
        </mesh>
        {[-2.2, 2.2].map((x) => (
          <mesh key={x} position={[x, 1.05, 0]}>
            <boxGeometry args={[0.14, 2.3, 1.8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.35} />
          </mesh>
        ))}

        {/* Terminals */}
        <mesh position={[-2.45, 1.72, 0]}>
          <boxGeometry args={[0.22, 0.5, 0.3]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[2.45, 0.15, 0]}>
          <boxGeometry args={[0.22, 0.5, 0.3]} />
          <meshStandardMaterial color="#ea580c" metalness={0.9} roughness={0.2} />
        </mesh>

        <BusBars />
        <EnergyFlow batteryId={battery.id} />
        {CELL_POSITIONS.map((p, i) => (
          <Cell key={i} index={i + 1} batteryId={battery.id} position={p} onSelect={selectCell} />
        ))}
        <SocBar batteryId={battery.id} />
        <GasHaze batteryId={battery.id} />
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={3.0}
        maxDistance={11}
        minPolarAngle={0.3}
        maxPolarAngle={1.35}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

export default function BatteryPack3D({ battery }: { battery: Battery }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [4.8, 3.2, 5.8], fov: 42 }}
      className="!absolute inset-0"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <PackScene battery={battery} />
    </Canvas>
  )
}
