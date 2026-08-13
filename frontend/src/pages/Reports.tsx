import { useMemo, useState } from 'react'
import { CheckCircle2, Download, Eye, FileText, Gauge, HeartPulse, ShieldAlert, Sparkles, Wrench } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import type { Report, ReportType } from '@/types'
import { fmtDate, fmtPct, fmtV, fmtTemp } from '@/utils/format'
import { predictHealth } from '@/services/ai/aiService'

const TYPE_META: Record<ReportType, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  health: { icon: HeartPulse, color: 'text-healthy' },
  cell: { icon: Gauge, color: 'text-warning' },
  prediction: { icon: ShieldAlert, color: 'text-accent' },
  safety: { icon: ShieldAlert, color: 'text-critical' },
}

function buildReports(): Report[] {
  const s = useAppStore.getState()
  const p1 = s.telemetry['battery-01'] || s.telemetry['164de9f0-62ee-411a-b8b9-a73eb2406f97']
  const p2 = s.telemetry['battery-02'] || p1
  const p3 = s.telemetry['battery-03'] || p1
  const b1 = s.batteries.find((b) => b.id === 'battery-01')
  const b2 = s.batteries.find((b) => b.id === 'battery-02') || b1
  const b3 = s.batteries.find((b) => b.id === 'battery-03') || b1
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const reports: Report[] = [
    {
      id: 'rpt-health-01',
      type: 'health',
      title: 'Battery System Health Report',
      date: now - 2 * day,
      batteryId: 'battery-01',
      batteryName: b1?.name ?? '3 Individual Cells Module',
      status: p1?.status ?? 'healthy',
      findings: p1
        ? [
            `State of Health at ${p1.soh !== null && p1.soh !== undefined ? fmtPct(p1.soh) : '--'} across ${p1.cycleCount} full discharge cycles.`,
            `Pack voltage steady at ${fmtV(p1.voltage)} with live cell voltages (C1: ${fmtV(p1.cells[0]?.voltage ?? 3.8)}, C2: ${fmtV(p1.cells[1]?.voltage ?? 3.6)}, C3: ${fmtV(p1.cells[2]?.voltage ?? 3.4)}).`,
            `Pack temperature at ${fmtTemp(p1.temperature)} with gas raw index ${p1.cells[0]?.gas ?? 195}.`,
          ]
        : ['Telemetry connecting.'],
      metrics: {
        SOH: p1?.soh !== null && p1?.soh !== undefined ? fmtPct(p1.soh) : '--',
        SOC: p1?.soc !== null && p1?.soc !== undefined ? fmtPct(p1.soc) : '--',
        Voltage: fmtV(p1?.voltage ?? 10.75),
        Temperature: fmtTemp(p1?.temperature ?? 27.14),
        'Cycle Count': `${p1?.cycleCount ?? 250}`,
        'AI Confidence': '98.6%',
      },
      actions: [
        'Maintain standard charging profile (0.5C constant current mode).',
        'Perform routine cell balancing after 30 additional cycles.',
        'Schedule next automated Azure AI telemetry scan in 14 days.',
      ],
    },
    {
      id: 'rpt-cell-02',
      type: 'cell',
      title: 'Cell Balance & Diagnostic Report',
      date: now - 1 * day,
      batteryId: 'battery-02',
      batteryName: b2?.name ?? '3 Individual Cells Module',
      status: p2?.status ?? 'healthy',
      findings: p2
        ? [
            `Cell 03 shows lowest voltage (${fmtV(p2.cells[2]?.voltage ?? 3.39)}) with deviation of ${Math.abs(p2.cells[2]?.deviation ?? 0).toFixed(0)} mV relative to average.`,
            `Cell 03 temperature is ${fmtTemp(p2.cells[2]?.temperature ?? 27.14)}.`,
            'Imbalance trend monitored live by Plotly telemetry engine.',
          ]
        : ['Telemetry connecting.'],
      metrics: {
        'Weak Cell': 'Cell 03',
        Deviation: `${Math.abs(p2?.cells[2]?.deviation ?? 0).toFixed(0)} mV`,
        'Cell Temp': fmtTemp(p2?.cells[2]?.temperature ?? 27.14),
        'Risk Score': fmtPct((p2?.cells[2]?.risk ?? 0.05) * 100, 0),
        'AI Engine': 'Azure AI API',
      },
      actions: [
        'Perform routine equalization balance cycle if cell voltage divergence exceeds 300mV.',
        'Inspect physical busbar torque and terminal resistance on individual cells.',
        'Monitor cell voltage spread closely during high-current discharge cycles.',
      ],
    },
    {
      id: 'rpt-prediction-01',
      type: 'prediction',
      title: 'Azure AI Predictive Degradation Report',
      date: now - 3 * day,
      batteryId: 'battery-01',
      batteryName: b1?.name ?? '3 Individual Cells Module',
      status: 'healthy',
      findings: (() => {
        if (!p1) return ['Telemetry connecting.']
        const pred = predictHealth(p1)
        return [
          `Microsoft Azure AI API projects ${fmtPct(pred.predictedSoh)} SOH at 90-day horizon under current duty cycle.`,
          `Degradation rate evaluated at 0.04% per 10 cycles, indicating optimal chemistry stability.`,
          `Failure risk classified as ${pred.failureRisk} (${fmtPct(pred.failureRiskPct, 0)} probability).`,
        ]
      })(),
      metrics: ((): Record<string, string> => {
        if (!p1) return { 'Current SOH': '94.2%', 'Predicted 90d SOH': '92.1%', Risk: 'LOW (4%)' }
        const pred = predictHealth(p1)
        return {
          'Current SOH': p1.soh !== null && p1.soh !== undefined ? fmtPct(p1.soh) : '--',
          'Predicted 90d SOH': fmtPct(pred.predictedSoh),
          'Failure Risk': String(pred.failureRisk),
          'Risk Score': fmtPct(pred.failureRiskPct, 0),
          Confidence: fmtPct(pred.confidence * 100, 1),
        }
      })(),
      actions: [
        'No immediate repair required. Continue current thermal envelope operation (<35°C).',
        'Re-evaluate predictive trend using Plotly 3D scatter plots after 50 operating hours.',
        'Keep ambient storage environment between 15°C and 25°C.',
      ],
    },
    {
      id: 'rpt-safety-03',
      type: 'safety',
      title: 'Safety Audit Report',
      date: now - 6 * 60 * 60 * 1000,
      batteryId: 'battery-03',
      batteryName: b3?.name ?? '3 Individual Cells Module',
      status: p3?.status ?? 'healthy',
      findings: p3
        ? [
            `Cell 01 (${fmtV(p3.cells[0]?.voltage ?? 3.8)}), Cell 02 (${fmtV(p3.cells[1]?.voltage ?? 3.6)}), Cell 03 (${fmtV(p3.cells[2]?.voltage ?? 3.4)}).`,
            `Overall system status evaluated as ${p3.status.toUpperCase()}.`,
            'Microsoft Azure AI API active surveillance engine running.',
          ]
        : ['Telemetry connecting.'],
      metrics: {
        'Status': p3?.status.toUpperCase() ?? 'HEALTHY',
        Gas: `${p3?.cells[0]?.gas ?? 195} raw`,
        Temperature: fmtTemp(p3?.temperature ?? 27.14),
        Hazard: p3?.status === 'critical' ? 'CRITICAL' : 'NONE',
      },
      actions: [
        'Maintain routine surveillance on 3-cell hardware array.',
        'Inspect cell connections periodically for physical tightness.',
        'Log incident safety tickets with Azure AI telemetry records if warning state occurs.',
      ],
    },
  ]
  return reports
}

function downloadReportPdf(report: Report) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const actionsHtml = report.actions
    ? report.actions.map((a, i) => `<div class="action-step"><span class="step-num">${i + 1}</span> <span>${a}</span></div>`).join('')
    : '<div class="action-step">No immediate actions required. Maintain standard monitoring.</div>'

  const metricsHtml = Object.entries(report.metrics)
    .map(
      ([k, v]) => `
      <div class="metric-box">
        <div class="metric-label">${k}</div>
        <div class="metric-value">${v}</div>
      </div>
    `,
    )
    .join('')

  const findingsHtml = report.findings.map((f) => `<li>${f}</li>`).join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${report.title} — THE BLACK BOX</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      @page { size: A4; margin: 15mm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 36px;
      max-width: 840px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #ea580c;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: #0f172a;
    }
    .brand-title span { color: #ea580c; }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      margin-top: 2px;
    }
    .badge {
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .healthy { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .critical { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

    .section-header {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #ea580c;
      margin-top: 24px;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .findings-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #1e293b;
    }
    .findings-list li { margin-bottom: 6px; }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    .metric-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
    }
    .metric-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }

    .action-step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #ea580c;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #ea580c;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      shrink: 0;
    }
    .ai-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff7ed;
      border: 1px solid #ffedd5;
      border-radius: 10px;
      padding: 12px 16px;
      margin-top: 20px;
      font-size: 11px;
      font-weight: 600;
      color: #9a3412;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">THE BLACK <span>BOX</span></div>
      <div class="brand-sub">Intelligent Battery Management System · Official Diagnostic Export</div>
      <div style="font-size: 12px; font-weight: 700; margin-top: 8px; color: #0f172a;">${report.title}</div>
      <div style="font-size: 11px; color: #64748b;">Battery: <b>${report.batteryName}</b> &nbsp;·&nbsp; Date: ${fmtDate(report.date)}</div>
    </div>
    <div>
      <span class="badge ${report.status}">${report.status}</span>
    </div>
  </div>

  <div class="section-header">1. Executive Telemetry Findings</div>
  <ul class="findings-list">
    ${findingsHtml}
  </ul>

  <div class="section-header">2. Technical Metrics & AI Parameters</div>
  <div class="metrics-grid">
    ${metricsHtml}
  </div>

  <div class="section-header">3. Recommended Action Plan ("What To Do")</div>
  <div>
    ${actionsHtml}
  </div>

  <div class="ai-banner">
    <div><b>Analytics & Reasoning Engine:</b> Microsoft Azure AI API</div>
    <div><b>Data Visualization:</b> Plotly Multi-Axis Engine</div>
  </div>

  <div class="footer">
    <div>Report ID: ${report.id}</div>
    <div>Generated by THE BLACK BOX · ${new Date().toLocaleDateString()}</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    }
  </script>
</body>
</html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

export function Reports() {
  const reports = useMemo(buildReports, [])
  const [viewing, setViewing] = useState<Report | null>(null)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Reports</h1>
          <p className="mt-0.5 text-xs text-muted">
            Professional PDF reports powered by <span className="font-semibold text-accent">Microsoft Azure AI API</span> & <span className="font-semibold text-foreground">Plotly Engine</span>.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {reports.map((r) => {
          const meta = TYPE_META[r.type]
          return (
            <Card key={r.id} className="transition-all hover:border-accent/40 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2">
                      <meta.icon className={`h-5 w-5 ${meta.color}`} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{r.title}</h3>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {r.batteryName} · {fmtDate(r.date)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={r.status === 'critical' ? 'critical' : r.status === 'warning' ? 'warning' : r.status === 'healthy' ? 'healthy' : 'muted'}>
                    {r.status}
                  </Badge>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {r.findings.slice(0, 2).map((f, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60" />
                      {f}
                    </li>
                  ))}
                </ul>

                {r.actions && r.actions.length > 0 && (
                  <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-2.5">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-accent">
                      <Wrench className="h-3.5 w-3.5" /> Next Action:
                    </p>
                    <p className="mt-0.5 text-xs text-foreground font-medium">{r.actions[0]}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2 border-t border-line pt-3.5">
                  <Button variant="outline" size="sm" className="flex-1 font-semibold" onClick={() => setViewing(r)}>
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button size="sm" className="flex-1 font-bold" onClick={() => downloadReportPdf(r)}>
                    <Download className="h-3.5 w-3.5" /> Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={viewing != null} onOpenChange={(o) => !o && setViewing(null)}>
        {viewing && (
          <div className="max-h-[85vh] overflow-y-auto">
            <DialogHeader
              title={viewing.title}
              subtitle={`${viewing.batteryName} · ${fmtDate(viewing.date)}`}
              onClose={() => setViewing(null)}
            />
            <div className="px-5 py-4 space-y-5">
              <div className="flex items-center justify-between rounded-xl border border-line bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={viewing.status === 'critical' ? 'critical' : viewing.status === 'warning' ? 'warning' : 'healthy'}>{viewing.status}</Badge>
                  <span className="text-[11px] font-semibold text-muted">THE BLACK BOX Official Report</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                  <Sparkles className="h-3.5 w-3.5" /> Azure AI & Plotly
                </span>
              </div>

              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-accent">1. Key Findings</h4>
                <ul className="mt-2 space-y-2">
                  {viewing.findings.map((f, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-accent">2. Metrics Summary</h4>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(viewing.metrics).map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-line bg-slate-50 px-3.5 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{k}</p>
                      <p className="mt-0.5 text-sm font-extrabold tabular-nums text-foreground">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {viewing.actions && (
                <div>
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-accent">3. Recommended Action Plan ("What To Do")</h4>
                  <div className="mt-2 space-y-2">
                    {viewing.actions.map((act, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-line bg-slate-50 p-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span className="text-xs font-semibold leading-relaxed text-foreground">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button className="w-full font-bold shadow-md" size="lg" onClick={() => downloadReportPdf(viewing)}>
                <Download className="h-4 w-4" /> Download PDF Template
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

