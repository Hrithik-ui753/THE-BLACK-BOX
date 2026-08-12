import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, ChevronRight, Send, Sparkles, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { ChatMessage } from '@/types'
import { aiService } from '@/services/ai/aiService'
import { useBattery, usePack } from '@/hooks/usePack'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'
import { fmtTime } from '@/utils/format'

const QUICK_PROMPTS = ['Is my battery safe?', 'Which cell needs attention?', 'Why is this cell weak?', 'What does the model predict?']

export function FloatingAIButton() {
  const chatOpen = useAppStore((s) => s.chatOpen)
  const setChatOpen = useAppStore((s) => s.setChatOpen)
  return (
    <motion.button
      type="button"
      onClick={() => setChatOpen(!chatOpen)}
      aria-label={chatOpen ? 'Close AI assistant' : 'Open AI assistant'}
      aria-expanded={chatOpen}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-surface shadow-panel shadow-glow-cyan transition-colors hover:bg-surface-2"
    >
      {!chatOpen && (
        <span className="absolute inset-0 -z-10 rounded-2xl border border-accent/40 status-dot-pulse" aria-hidden="true" />
      )}
      <AnimatePresence mode="wait" initial={false}>
        {chatOpen ? (
          <motion.span key="close" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
            <X className="h-5.5 w-5.5 text-accent" />
          </motion.span>
        ) : (
          <motion.span key="bot" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
            <Bot className="h-5.5 w-5.5 text-accent" />
          </motion.span>
        )}
      </AnimatePresence>
      {!chatOpen && (
        <span className="absolute -top-1 -right-1 flex h-5 items-center rounded-full bg-accent px-1.5 text-[9px] font-bold text-background">
          AI
        </span>
      )}
    </motion.button>
  )
}

function ContextChips() {
  const battery = useAppStore((s) => s.batteries.find((b) => b.id === s.selectedBatteryId) ?? null)
  const cellIndex = useAppStore((s) => s.selectedCellIndex)
  return (
    <div className="flex flex-wrap items-center gap-1 px-4 pb-2 text-[11px] text-muted">
      <span className="font-semibold text-faint uppercase tracking-wide">Context</span>
      {battery ? (
        <>
          <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-medium text-foreground">{battery.name}</span>
          {cellIndex != null && (
            <>
              <ChevronRight className="h-3 w-3 text-faint" />
              <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-medium text-foreground">
                Cell {String(cellIndex).padStart(2, '0')}
              </span>
            </>
          )}
        </>
      ) : (
        <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-medium text-faint">No battery selected</span>
      )}
    </div>
  )
}

function ChatMessageView({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
          <Bot className="h-3.5 w-3.5 text-accent" />
        </span>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
          isUser ? 'rounded-br-md bg-accent/15 text-foreground border border-accent/20' : 'rounded-bl-md bg-surface-2 text-foreground border border-line',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className="mt-1 text-right text-[9px] text-faint">{fmtTime(message.timestamp)}</p>
      </div>
    </motion.div>
  )
}

export function AIChatPanel() {
  const open = useAppStore((s) => s.chatOpen)
  const setOpen = useAppStore((s) => s.setChatOpen)
  const messages = useAppStore((s) => s.messages)
  const addMessage = useAppStore((s) => s.addMessage)
  const clearMessages = useAppStore((s) => s.clearMessages)
  const aiTyping = useAppStore((s) => s.aiTyping)
  const setAiTyping = useAppStore((s) => s.setAiTyping)
  const selectedBatteryId = useAppStore((s) => s.selectedBatteryId)
  const selectedCellIndex = useAppStore((s) => s.selectedCellIndex)
  const battery = useBattery(selectedBatteryId)
  const pack = usePack(selectedBatteryId)
  const isMobile = useIsMobile()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, aiTyping, open])

  useEffect(() => {
    if (open && messages.length === 0) {
      const batteryName = battery?.name
      const packSoh = pack?.soh
      const statusText = pack ? (pack.status === 'healthy' ? 'healthy' : pack.status) : 'unknown'
      addMessage({
        role: 'assistant',
        content: batteryName && packSoh != null
          ? `${batteryName} is currently ${statusText} at ${packSoh.toFixed(1)}% SOH. Ask me anything about its cells, safety, or what the model predicts.`
          : `Select a battery to analyze. I can explain cell health, anomalies, temperature trends and model predictions.`,
      })
    }
  }, [open, battery, pack, messages.length, addMessage])

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q) return
    const currentMessages = messages
    addMessage({ role: 'user', content: q })
    setInput('')
    setAiTyping(true)
    const reply = await aiService.answerQuestion(q, {
      battery,
      pack: pack ?? null,
      cellIndex: selectedCellIndex,
      history: currentMessages.map((m) => ({ role: m.role, content: m.content })),
    })
    setAiTyping(false)
    addMessage({ role: 'assistant', content: reply })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={isMobile ? { y: '100%' } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
          exit={isMobile ? { y: '100%' } : { opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          className={cn(
            'fixed z-40 flex flex-col overflow-hidden border border-line bg-surface shadow-panel',
            isMobile
              ? 'inset-x-0 bottom-0 top-auto h-[70dvh] rounded-t-2xl border-b-0'
              : 'bottom-24 right-5 h-[560px] max-h-[70dvh] w-[380px] rounded-2xl',
          )}
          role="dialog"
          aria-label="THE BLACK BOX AI assistant"
        >
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
              <Sparkles className="h-4 w-4 text-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">THE BLACK BOX AI</p>
              <p className="text-[10px] font-medium text-accent">Microsoft Azure AI & Plotly Engine</p>
            </div>
            <button
              type="button"
              onClick={() => clearMessages()}
              aria-label="Clear conversation"
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <ContextChips />

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <ChatMessageView key={m.id} message={m} />
            ))}
            {aiTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </span>
                <span className="flex gap-1 py-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-accent"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </span>
              </motion.div>
            )}
          </div>

          <div className="border-t border-line p-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void ask(p)}
                  className="shrink-0 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-accent-soft"
                >
                  {p}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void ask(input)
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this battery..."
                aria-label="Ask CellGuard AI"
                className="h-10 flex-1 rounded-lg border border-line bg-background-2 px-3 text-[13px] text-foreground placeholder:text-faint focus-visible:border-accent/60 focus-visible:outline-none"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || aiTyping}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-background transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
