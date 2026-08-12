import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Send, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, History } from 'lucide-react'
import { gmailAlertService, type AlertConfig, type AlertHistoryItem } from '@/services/alerts/gmailAlertService'

export interface GmailAlertSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function GmailAlertSettingsModal({ open, onClose }: GmailAlertSettingsModalProps) {
  const [recipient, setRecipient] = useState('')
  const [config, setConfig] = useState<AlertConfig | null>(null)
  const [history, setHistory] = useState<AlertHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (open) {
      void loadData()
    }
  }, [open])

  const loadData = async () => {
    const cfg = await gmailAlertService.getConfig()
    setConfig(cfg)
    if (cfg.defaultRecipient && cfg.defaultRecipient !== 'Not set') {
      setRecipient(cfg.defaultRecipient)
    }
    const hist = await gmailAlertService.getHistory()
    setHistory(hist)
  }

  const handleTestAlert = async () => {
    setLoading(true)
    setTestResult(null)
    const res = await gmailAlertService.sendTestAlert(recipient)
    setTestResult(res)
    setLoading(false)
    void loadData()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} className="max-w-xl p-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
            <Mail className="h-5 w-5 text-accent" />
          </span>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">
              📧 Automatic Gmail Battery Alert System
            </h2>
            <p className="text-xs text-muted">
              Configure SMTP recipient & automated smart alert triggers
            </p>
          </div>
        </div>

        <Button size="sm" variant="ghost" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="mt-5 space-y-5 text-xs text-foreground font-sans">
        {/* Status Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-line bg-background-2/80 p-3.5">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${config?.isConfigured ? 'bg-healthy status-dot-pulse' : 'bg-warning'}`} />
            <span className="font-bold">
              {config?.isConfigured ? 'Gmail SMTP Server Connected' : 'Gmail Credentials Not Set in backend/.env'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-faint uppercase">
            {config?.smtpHost}:{config?.smtpPort}
          </span>
        </div>

        {/* Recipient Email Config */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black uppercase text-foreground">
            Alert Recipient Email Address
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="e.g. safety-engineer@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="flex-1 font-medium"
            />
            <Button onClick={handleTestAlert} disabled={loading} className="gap-1.5 font-bold shrink-0">
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Test Alert
            </Button>
          </div>
          <p className="text-[10px] text-faint">
            Target email for critical cell voltage, severe imbalance, and thermal runaway alerts.
          </p>
        </div>

        {/* Feedback Alert Box */}
        {testResult && (
          <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 ${testResult.success ? 'border-healthy/40 bg-healthy/10 text-healthy' : 'border-critical/40 bg-critical/10 text-critical'}`}>
            {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            <div className="font-bold">
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* Smart Alerting Rules Info Box */}
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 space-y-2">
          <div className="flex items-center gap-2 font-black text-accent-soft">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Smart Deduplication & Recovery Rules</span>
          </div>
          <ul className="space-y-1 text-muted font-medium text-[11px] list-disc list-inside">
            <li><strong>First Detection:</strong> Dispatches instant alert email to recipient.</li>
            <li><strong>Condition Persists:</strong> Suppresses duplicate emails to avoid spam.</li>
            <li><strong>Escalation:</strong> Dispatches escalation email if severity increases.</li>
            <li><strong>Recovery:</strong> Sends <strong className="text-healthy">🟢 RECOVERY</strong> notification when safe bounds return.</li>
          </ul>
        </div>

        {/* Sent Alert Log History */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black uppercase text-muted flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-accent" /> Sent Alert History Log
            </h4>
            <span className="text-[10px] text-faint">Last 50 Events</span>
          </div>

          <div className="max-h-40 overflow-y-auto rounded-xl border border-line bg-background-2/60 p-2 divide-y divide-line/40">
            {history.length === 0 ? (
              <p className="p-3 text-center text-faint italic font-medium">No email alert events logged yet.</p>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.severity === 'CRITICAL' ? 'bg-critical' : item.severity === 'WARNING' ? 'bg-warning' : 'bg-healthy'}`} />
                    <span className="font-bold text-foreground">{item.battery_id}</span>
                    <span className="text-muted">({item.severity})</span>
                  </div>
                  <span className="text-faint font-mono text-[10px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
