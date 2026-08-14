import { motion } from 'framer-motion'
import type { Battery, PackTelemetry } from '@/types'
import { STATUS_COLOR } from '@/constants/status'
import { cn } from '@/utils/cn'
import { fmtV } from '@/utils/format'



export function BatteryPack2D({
  battery,
  pack,
  selectedCell,
  onSelectCell,
  className,
}: {
  battery: Battery
  pack: PackTelemetry | undefined
  selectedCell: number | null
  onSelectCell: (index: number) => void
  className?: string
}) {
  const isIntegratedMode = battery.mode === 'integrated_3s' || battery.id === 'battery-01'
  const charging = pack?.chargeState === 'charging'
  const cellCount = battery.cellCount || 3
  const cellW = 140
  const cellH = 110
  const gapX = 24
  const ox = 45
  const oy = 85

  const cx = (col: number) => ox + col * (cellW + gapX) + cellW / 2
  const cy = () => oy + cellH / 2

  return (
    <div className={cn('flex flex-col items-center justify-center p-4 w-full h-full', className)}>
      {/* Mode Status Header Pill */}
      <div className="mt-8 mb-3 flex items-center justify-between w-full max-w-[620px] rounded-xl border border-line bg-surface/90 px-4 py-2.5 text-xs backdrop-blur-md shadow-sm z-10">
        <span className="flex items-center gap-2 font-bold text-foreground">
          <span className={`h-2.5 w-2.5 rounded-full status-dot-pulse ${isIntegratedMode ? 'bg-accent' : 'bg-warning'}`} />
          {isIntegratedMode ? 'Option 1: 3-Cell Integrated Lithium Pack (3S Unit)' : 'Option 2: 3 Individual Cells Module'}
        </span>
        <span className="font-extrabold tabular-nums text-accent">
          {pack ? `${pack.voltage.toFixed(2)} V Total` : '12.30 V Total'}
        </span>
      </div>

      <svg viewBox="0 0 570 280" className="max-h-full w-full max-w-[660px]" role="img" aria-label={`${battery.name} battery pack visualization`}>
        <defs>
          <radialGradient id="pack-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={isIntegratedMode ? "#0284c7" : "#ea580c"} stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          {(['healthy', 'warning', 'critical'] as const).map((s) => (
            <radialGradient key={s} id={`smoke-${s}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={STATUS_COLOR[s]} stopOpacity="0.35" />
              <stop offset="70%" stopColor={STATUS_COLOR[s]} stopOpacity="0.12" />
              <stop offset="100%" stopColor={STATUS_COLOR[s]} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Housing Enclosure */}
        <rect x="8" y="8" width="554" height="264" rx="24" fill="url(#pack-glow)" />
        <rect
          x="18"
          y="18"
          width="534"
          height="244"
          rx="20"
          fill="#ffffff"
          stroke={isIntegratedMode ? "#bae6fd" : "#fed7aa"}
          strokeWidth="2"
          className="shadow-sm"
        />

        {/* Integrated Pack Housing Banner for Option 1 */}
        {isIntegratedMode && (
          <g>
            <rect x="30" y="32" width="510" height="34" rx="10" fill="#f0f9ff" stroke="#e0f2fe" strokeWidth="1.5" />
            <text x="285" y="53" textAnchor="middle" fill="#0369a1" fontSize="10" fontWeight="800" letterSpacing="0.04em">
              UNIFIED 3S INTEGRATED PACK · (CELL 1 + CELL 2 + CELL 3 = PACK VOLTAGE)
            </text>
          </g>
        )}

        {/* Individual Modular Header Banner for Option 2 */}
        {!isIntegratedMode && (
          <g>
            <rect x="30" y="32" width="510" height="34" rx="10" fill="#fff7ed" stroke="#ffedd5" strokeWidth="1.5" />
            <text x="285" y="53" textAnchor="middle" fill="#c2410c" fontSize="10" fontWeight="800" letterSpacing="0.04em">
              3 INDIVIDUAL CELL MODULES · (CELL VOLTAGES SUM TO PACK VOLTAGE)
            </text>
          </g>
        )}

        {/* Energy series connection line */}
        <path
          d={`M ${cx(0)},${cy()} L ${cx(1)},${cy()} L ${cx(2)},${cy()}`}
          fill="none"
          stroke={charging ? '#ea580c' : '#0284c7'}
          strokeWidth="3"
          strokeDasharray="6 6"
          strokeLinecap="round"
          className={charging ? 'energy-flow' : 'energy-flow-slow'}
          opacity={0.7}
        />

        {/* Render 3 Cells */}
        {Array.from({ length: Math.min(cellCount, 3) }, (_, i) => {
          const index = i + 1
          const cell = pack?.cells?.find((c) => c.index === index)
          const status = cell?.status ?? (i === 1 && !isIntegratedMode ? 'warning' : 'healthy')
          const color = STATUS_COLOR[status]
          const selected = selectedCell === index

          const cellBg = status === 'healthy' ? '#f0fdf4' : status === 'warning' ? '#fffbeb' : '#fef2f2'
          const cellBorder = status === 'healthy' ? '#bbf7d0' : status === 'warning' ? '#fde68a' : '#fecaca'

          return (
            <g key={index} className="cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => onSelectCell(index)}>
              {selected && (
                <motion.rect
                  layoutId={`cell-ring-${battery.id}`}
                  x={ox + i * (cellW + gapX) - 5}
                  y={oy - 5}
                  width={cellW + 10}
                  height={cellH + 10}
                  rx={18}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
              )}
              <rect
                x={ox + i * (cellW + gapX)}
                y={oy}
                width={cellW}
                height={cellH}
                rx={16}
                fill={cellBg}
                stroke={selected ? '#ea580c' : cellBorder}
                strokeWidth={selected ? 2.5 : 1.5}
              />

              {/* Cell Label Pill */}
              <rect
                x={cx(i) - 40}
                y={cy() - 42}
                width="80"
                height="20"
                rx="10"
                fill="#ffffff"
                stroke={color}
                strokeWidth="1.5"
              />
              <circle cx={cx(i) - 24} cy={cy() - 32} r="3.5" fill={color} className="status-dot-pulse" />
              <text x={cx(i) + 6} y={cy() - 28} textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="800" letterSpacing="0.05em">
                CELL {String(index).padStart(2, '0')}
              </text>

              {/* Live Voltage Readout */}
              <text x={cx(i)} y={cy() + 6} textAnchor="middle" fontSize="17" fontWeight="900" fill="#0f172a" className="tabular-nums">
                {cell ? fmtV(cell.voltage) : (i === 0 ? '4.12 V' : i === 1 ? (isIntegratedMode ? '4.08 V' : '3.65 V') : '4.10 V')}
              </text>

              {/* Temp readout */}
              <text x={cx(i)} y={cy() + 27} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b">
                {cell ? `${cell.temperature.toFixed(1)}°C` : '35.4°C'}
              </text>

              {/* Gas / Warning Haze */}
              {cell && cell.gas > 8 && (
                <circle
                  cx={cx(i)}
                  cy={cy() - 30}
                  r={24 + cell.gas * 0.3}
                  fill={`url(#smoke-${status})`}
                  className="smoke-rise"
                />
              )}
            </g>
          )
        })}

        {/* Terminals */}
        <rect x="10" y="98" width="12" height="70" rx="4" fill="#cbd5e1" />
        <rect x="548" y="98" width="12" height="70" rx="4" fill="#cbd5e1" />
        <text x="16" y="88" textAnchor="middle" fontSize="13" fontWeight="900" fill="#475569">−</text>
        <text x="554" y="88" textAnchor="middle" fontSize="13" fontWeight="900" fill={charging ? '#ea580c' : '#0284c7'}>
          +
        </text>

        {/* Total Pack Sum Indicator Footer */}
        <g>
          <rect x="30" y="215" width="510" height="34" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
          <text x="285" y="236" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="800" letterSpacing="0.03em">
            TOTAL PACK VOLTAGE: {pack ? pack.voltage.toFixed(2) : '12.30'} V · SOH: {pack?.soh !== null && pack?.soh !== undefined ? `${pack.soh.toFixed(1)}%` : '--'} · SOC: {pack?.soc !== null && pack?.soc !== undefined ? `${pack.soc.toFixed(0)}%` : '--'}
          </text>
        </g>
      </svg>
    </div>
  )
}

