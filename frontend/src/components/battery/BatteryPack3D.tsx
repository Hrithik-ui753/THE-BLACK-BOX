import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Battery } from '@/types'
import { STATUS_COLOR } from '@/constants/status'
import { useAppStore } from '@/store/useAppStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const CELL_R = 0.48
const CELL_H = 1.7
const COLS = [-1.78, 0, 1.78]
const ROWS = [1.04, -1.04]
const CELL_POSITIONS: THREE.Vector3[] = []
for (let r = 0; r < 2; r++) {
  for (let c = 0; c < 3; c++) {
    CELL_POSITIONS.push(new THREE.Vector3(COLS[c], CELL_H / 2, ROWS[r]))
  }
}

const SERIES_ORDER = [0, 1, 2, 5, 4, 3] // cell indices (0-based) in electrical series
const DEFAULT_TARGET = new THREE.Vector3(0, 1, 0)
const PARTICLE_COUNT = 26
const ENERGY_CHARGING = new THREE.Color('#22d3ee')
const ENERGY_DISCHARGING = new THREE.Color('#5b8db8')

function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(34,211,238,0.55)')
  g.addColorStop(0.35, 'rgba(34,211,238,0.18)')
  g.addColorStop(1, 'rgba(34,211,238,0)')
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

// ————— Cell mesh (memoized; reads telemetry directly from the store) —————
const Cell = memo(function Cell({
  index,
  position,
  onSelect,
}: {
  index: number
  position: THREE.Vector3
  onSelect: (i: number) => void
}) {
  const capRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const reduced = useReducedMotion()
  const color = useRef(new THREE.Color('#34d399'))

  useFrame(({ clock }) => {
    const st = useAppStore.getState()
    const pack = st.selectedBatteryId ? st.telemetry[st.selectedBatteryId] : undefined
    const cell = pack?.cells.find((c) => c.index === index)
    const status = cell?.status ?? 'healthy'
    color.current.set(STATUS_COLOR[status])
    const t = clock.elapsedTime
    const pulse = 0.55 + Math.sin(t * 1.6 + index) * (status === 'healthy' ? 0.14 : 0.24)
    if (capRef.current) {
      const m = capRef.current.material as THREE.MeshStandardMaterial
      m.emissive.copy(color.current)
      m.emissiveIntensity = reduced ? 0.5 : pulse
    }
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshStandardMaterial
      m.emissive.copy(color.current)
      m.emissiveIntensity = reduced ? 0.7 : 0.9 + Math.sin(t * 1.6 + index) * 0.2
    }
    // gentle breathing scale on the body
    if (bodyRef.current && !reduced) {
      const s = 1 + Math.sin(t * 1.4 + index * 1.7) * 0.006
      bodyRef.current.scale.setScalar(s)
    }
  })

  return (
    <group position={position}>
      <mesh ref={bodyRef} onClick={(e) => { e.stopPropagation(); onSelect(index) }} castShadow>
        <cylinderGeometry args={[CELL_R, CELL_R, CELL_H, 28]} />
        <meshStandardMaterial color="#12233a" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, CELL_H / 2 + 0.02, 0]} onClick={(e) => { e.stopPropagation(); onSelect(index) }}>
        <cylinderGeometry args={[0.32, 0.32, 0.06, 24]} />
        <meshStandardMaterial color="#9fb4cc" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh ref={capRef} position={[0, CELL_H / 2 + 0.02, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.012, 24]} />
        <meshStandardMaterial color="#0b1625" emissive="#34d399" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={ringRef} position={[0, CELL_H / 2 + 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.37, 0.028, 12, 32]} />
        <meshStandardMaterial color="#0b1625" emissive="#34d399" emissiveIntensity={0.8} transparent opacity={0.85} />
      </mesh>
    </group>
  )
})

// ————— Energy particles —————
function EnergyFlow({ batteryId }: { batteryId: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const phases = useRef<number[]>(Array.from({ length: PARTICLE_COUNT }, (_, i) => i / PARTICLE_COUNT))
  const dirRef = useRef(1)
  const colorRef = useRef(new THREE.Color('#22d3ee'))
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const reduced = useReducedMotion()

  const curve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-2.86, 1.75, 1.04), // terminal −
      ...SERIES_ORDER.map((i) => CELL_POSITIONS[i].clone().setY(CELL_H + 0.14)),
      new THREE.Vector3(-2.86, 0.1, -1.04), // terminal + (bottom)
      new THREE.Vector3(-2.86, 0.1, 1.6), // behind the pack
    ]
    return new THREE.CatmullRomCurve3(pts, true)
  }, [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const pack = useAppStore.getState().telemetry[batteryId]
    const charging = pack?.chargeState === 'charging'
    const targetDir = charging ? 1 : -1
    dirRef.current += (targetDir - dirRef.current) * 0.05
    colorRef.current.lerp(charging ? ENERGY_CHARGING : ENERGY_DISCHARGING, 0.05)

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
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

// ————— Bus bars between cells —————
function BusBars() {
  const segments = useMemo(() => {
    const pts = SERIES_ORDER.map((i) => CELL_POSITIONS[i].clone().setY(CELL_H + 0.06))
    const out: Array<{ a: THREE.Vector3; b: THREE.Vector3 }> = []
    for (let i = 0; i < pts.length - 1; i++) out.push({ a: pts[i], b: pts[i + 1] })
    out.push({
      a: new THREE.Vector3(pts[0].x, pts[0].y, 1.04),
      b: new THREE.Vector3(-2.86, 1.78, 1.04),
    })
    out.push({
      a: new THREE.Vector3(pts[pts.length - 1].x, 0.12, -1.04),
      b: new THREE.Vector3(-2.86, 0.12, -1.04),
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
            <meshStandardMaterial color="#1e3350" metalness={0.85} roughness={0.3} />
          </mesh>
        )
      })}
    </>
  )
}

// ————— SOC energy bar —————
function SocBar({ batteryId }: { batteryId: string }) {
  const fillRef = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const pack = useAppStore.getState().telemetry[batteryId]
    const target = (pack?.soc ?? 50) / 100
    const m = fillRef.current
    if (m) {
      m.scale.y += (target - m.scale.y) * 0.05
    }
  })
  return (      <group position={[3.12, 0, 0]}>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.2, 2.0, 0.2]} />
        <meshStandardMaterial color="#0e1a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh ref={fillRef} position={[0, 0.14, 0]}>
        <boxGeometry args={[0.12, 1.88, 0.12]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.7} />
      </mesh>
      <Html position={[0, 2.25, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-widest text-faint">SOC</span>
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
    const pack = useAppStore.getState().telemetry[batteryId]
    const t = clock.elapsedTime
    pack?.cells.forEach((cell) => {
      const spr = sprites.current[cell.index - 1]
      if (!spr) return
      const gas = cell.gas
      const colorIdx = cell.status === 'critical' ? 1 : 0
      if (gas <= 8) {
        spr.visible = false
        return
      }
      spr.visible = true
      spr.material = new THREE.SpriteMaterial({
        map: hazes[colorIdx],
        transparent: true,
        opacity: 0.14 + gas * 0.004 + Math.sin(t * 0.8 + cell.index) * 0.02,
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
    const desired = focusRef.current != null ? 5.2 : 9.2
    const dir = state.camera.position.clone().sub(c.target)
    const dist = dir.length()
    dir.normalize()
    const newDist = dist + (desired - dist) * k
    state.camera.position.copy(c.target.clone().add(dir.multiplyScalar(newDist)))
    c.update()
  })

  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[5, 8, 4]} intensity={1.35} />
      <directionalLight position={[-6, 4, -5]} intensity={0.45} color="#ea580c" />
      <pointLight position={[0, 4, -3]} intensity={0.6} color="#0284c7" />
      <fog attach="fog" args={['#f8fafc', 12, 24]} />

      {/* ground disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* backdrop glow */}
      <sprite position={[0, 1.2, -2.6]} scale={[7, 4, 1]}>
        <spriteMaterial map={glowTexture} transparent opacity={0.35} depthWrite={false} />
      </sprite>

      <group>
        {/* chassis */}
        <mesh position={[0, 1.15, -1.22]}>
          <boxGeometry args={[5.2, 2.3, 0.12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[5.2, 0.12, 3.1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.4} />
        </mesh>
        {[-2.6, 2.6].map((x) => (
          <mesh key={x} position={[x, 1.05, 0]}>
            <boxGeometry args={[0.14, 2.3, 3.1]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.4} />
          </mesh>
        ))}
        {/* terminals */}
        <mesh position={[-2.9, 1.72, 1.04]}>
          <boxGeometry args={[0.22, 0.5, 0.3]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-2.9, 0.12, -1.04]}>
          <boxGeometry args={[0.22, 0.5, 0.3]} />
          <meshStandardMaterial color="#ea580c" metalness={0.9} roughness={0.2} />
        </mesh>

        <BusBars />
        <EnergyFlow batteryId={battery.id} />
        {CELL_POSITIONS.map((p, i) => (
          <Cell key={i} index={i + 1} position={p} onSelect={selectCell} />
        ))}
        <SocBar batteryId={battery.id} />
        <GasHaze batteryId={battery.id} />
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={3.4}
        maxDistance={12}
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
      camera={{ position: [5.6, 3.4, 6.8], fov: 42 }}
      className="!absolute inset-0"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <PackScene battery={battery} />
    </Canvas>
  )
}
