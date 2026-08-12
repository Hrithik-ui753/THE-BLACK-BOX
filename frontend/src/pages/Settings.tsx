import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, Zap, Palette, Gauge, BrainCircuit, BellRing, Mail } from 'lucide-react'
import { useState } from 'react'
import { GmailAlertSettingsModal } from '@/components/settings/GmailAlertSettingsModal'

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="sm:max-w-xs">
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function Settings() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const batteries = useAppStore((s) => s.batteries)
  const [deviceName, setDeviceName] = useState(settings.deviceName)
  const [gmailModalOpen, setGmailModalOpen] = useState(false)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <GmailAlertSettingsModal open={gmailModalOpen} onClose={() => setGmailModalOpen(false)} />
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Settings</h1>
      <p className="mt-1 text-sm text-muted">Configure your monitoring system, AI behavior and device connection.</p>

      <div className="mt-6 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" /> Battery configuration
            </CardTitle>
            <CardDescription>Batteries attached to your THE BLACK BOX account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {batteries.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-line bg-background-2 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{b.name}</p>
                    <p className="text-[11px] text-muted">{b.type} · {b.cellCount} cells</p>
                  </div>
                  <Badge variant={b.status === 'healthy' ? 'healthy' : 'warning'} className="capitalize">
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-accent" /> Connected device
            </CardTitle>
            <CardDescription>ESP32 / BMS gateway connection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-line bg-background-2 px-3.5 py-3">
              <div className="flex items-center gap-3">
                {settings.deviceConnected ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-healthy/30 bg-healthy/10">
                    <Wifi className="h-4 w-4 text-healthy" />
                  </span>
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2">
                    <WifiOff className="h-4 w-4 text-faint" />
                  </span>
                )}
                <div>
                  <p className="text-[13px] font-medium text-foreground">{settings.deviceConnected ? 'Connected' : 'Disconnected'}</p>
                  <p className="text-[11px] text-muted">
                    {settings.deviceConnected ? 'Streaming live telemetry at 1.5s' : 'No active telemetry stream'}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.deviceConnected}
                onCheckedChange={(v) => updateSettings({ deviceConnected: v })}
                aria-label="Toggle device connection"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="device-name">Device name</Label>
                <Input
                  id="device-name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="mt-1.5"
                  placeholder="ESP32-XXXXXX"
                />
              </div>
              <Button variant="outline" onClick={() => updateSettings({ deviceName })}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-accent" /> Notification & Gmail Alert System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingRow title="Safety alerts" description="Push warnings when cells enter warning or critical states.">
              <Switch
                checked={settings.alertsEnabled}
                onCheckedChange={(v) => updateSettings({ alertsEnabled: v })}
                aria-label="Toggle safety alerts"
              />
            </SettingRow>
            <Separator />
            <SettingRow title="Automatic Gmail Alerts" description="Configure SMTP recipient & automated smart email notifications.">
              <Button size="sm" onClick={() => setGmailModalOpen(true)} className="gap-1.5 font-bold">
                <Mail className="h-3.5 w-3.5" /> Configure Gmail Alerts
              </Button>
            </SettingRow>
            <Separator />
            <SettingRow title="AI insights" description="Generate automated AI explanations for detected anomalies.">
              <Switch
                checked={settings.aiEnabled}
                onCheckedChange={(v) => updateSettings({ aiEnabled: v })}
                aria-label="Toggle AI insights"
              />
            </SettingRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-accent" /> AI preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingRow title="AI assistant" description="Enable the context-aware battery intelligence assistant.">
              <Switch
                checked={settings.aiEnabled}
                onCheckedChange={(v) => updateSettings({ aiEnabled: v })}
                aria-label="Toggle AI assistant"
              />
            </SettingRow>
            <Separator />
            <SettingRow title="Data refresh interval" description="How often telemetry is sampled from the device.">
              <Select
                value={String(settings.refreshIntervalMs)}
                onChange={(e) => updateSettings({ refreshIntervalMs: Number(e.target.value) })}
                aria-label="Data refresh interval"
              >
                <option value="1000">1 second</option>
                <option value="1500">1.5 seconds</option>
                <option value="2000">2 seconds</option>
                <option value="5000">5 seconds</option>
              </Select>
            </SettingRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-accent" /> Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingRow title="Measurement system" description="Units used across telemetry and reports.">
              <Select
                value={settings.units}
                onChange={(e) => updateSettings({ units: e.target.value as 'metric' | 'imperial' })}
                aria-label="Units"
              >
                <option value="metric">Metric (°C, V, A)</option>
                <option value="imperial">Imperial (°F)</option>
              </Select>
            </SettingRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-accent" /> Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingRow
              title="Appearance"
              description="THE BLACK BOX uses an engineered modern white theme for high-visibility telemetry."
            >
              <Badge variant="accent" className="capitalize">Modern White · Active</Badge>
            </SettingRow>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
