const STORAGE_KEY = 'offline_queue'

export interface QueuedOperation {
  id: string
  type: string
  endpoint: string
  method: string
  body?: any
  createdAt: string
  status: 'pending' | 'completed' | 'failed'
  error?: string
}

export function addToQueue(op: Omit<QueuedOperation, 'id' | 'createdAt' | 'status'>): string {
  const queue = getQueue()
  const id = `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  queue.push({
    ...op,
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',
  })
  saveQueue(queue)
  return id
}

export function getQueue(): QueuedOperation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedOperation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function removeFromQueue(id: string) {
  saveQueue(getQueue().filter(op => op.id !== id))
}

export function markFailed(id: string, error: string) {
  const queue = getQueue()
  const op = queue.find(o => o.id === id)
  if (op) { op.status = 'failed'; op.error = error; saveQueue(queue) }
}

export function getQueueStats() {
  const queue = getQueue()
  return {
    total: queue.length,
    pending: queue.filter(o => o.status === 'pending').length,
    failed: queue.filter(o => o.status === 'failed').length,
    completed: queue.filter(o => o.status === 'completed').length,
  }
}

type QueueResult = { success: boolean; id: string; error?: string; response?: any }

export async function processQueue(): Promise<QueueResult[]> {
  const queue = getQueue()
  const results: QueueResult[] = []
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  for (const op of queue) {
    if (op.status === 'completed') continue
    try {
      const res = await fetch(`${apiUrl}${op.endpoint}`, {
        method: op.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: op.body ? JSON.stringify(op.body) : undefined,
      })
      if (res.ok) {
        removeFromQueue(op.id)
        results.push({ success: true, id: op.id, response: await res.json().catch(() => null) })
      } else {
        const body = await res.json().catch(() => ({ message: 'Sync failed' }))
        if (res.status === 409 || res.status === 400) {
          removeFromQueue(op.id)
          results.push({ success: false, id: op.id, error: body.message, response: body })
        } else {
          markFailed(op.id, body.message)
          results.push({ success: false, id: op.id, error: body.message })
          break
        }
      }
    } catch (err: any) {
      markFailed(op.id, err.message)
      results.push({ success: false, id: op.id, error: err.message })
      break
    }
  }

  return results
}
