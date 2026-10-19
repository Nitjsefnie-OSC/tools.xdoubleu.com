// Logger used instead of console.*: logs locally and fire-and-forgets a
// batched copy to the api's log store via POST /logs (api/cmd/api/spa_logs.go).

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface QueuedEntry {
  occurred_at: string
  level: string
  message: string
  attrs?: Record<string, unknown>
}

const FLUSH_DELAY_MS = 2000
const MAX_BATCH_SIZE = 25

let queue: QueuedEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(flush, FLUSH_DELAY_MS)
}

function flush() {
  flushTimer = null
  if (queue.length === 0) return
  const entries = queue
  queue = []
  void send(entries)
}

async function send(entries: QueuedEntry[]): Promise<void> {
  try {
    await fetch('/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries })
    })
  } catch {
    // Best-effort: the console output already happened.
  }
}

function enqueue(level: LogLevel, message: string, attrs?: Record<string, unknown>) {
  queue.push({ occurred_at: new Date().toISOString(), level, message, attrs })
  if (queue.length >= MAX_BATCH_SIZE) {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    flush()
  } else {
    scheduleFlush()
  }
}

function consoleFor(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case 'debug':
      return console.debug
    case 'warn':
      return console.warn
    case 'error':
      return console.error
    default:
      return console.info
  }
}

function log(level: LogLevel, message: string, attrs?: Record<string, unknown>) {
  const fn = consoleFor(level)
  if (attrs) fn(message, attrs)
  else fn(message)
  enqueue(level, message, attrs)
}

export const logger = {
  debug: (message: string, attrs?: Record<string, unknown>) => log('debug', message, attrs),
  info: (message: string, attrs?: Record<string, unknown>) => log('info', message, attrs),
  warn: (message: string, attrs?: Record<string, unknown>) => log('warn', message, attrs),
  error: (message: string, attrs?: Record<string, unknown>) => log('error', message, attrs)
}
