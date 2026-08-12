export function fmtV(v: number, digits = 2): string {
  return `${v.toFixed(digits)} V`
}

export function fmtTemp(t: number): string {
  return `${t.toFixed(1)} °C`
}

export function fmtAmp(a: number): string {
  return `${a >= 0 ? '+' : ''}${a.toFixed(1)} A`
}

export function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

export function fmtMv(mv: number): string {
  return `${Math.abs(mv).toFixed(0)} mV`
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function round(v: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round(v * f) / f
}
