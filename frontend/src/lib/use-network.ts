'use client'

import { useState, useEffect, useCallback } from 'react'
import { getQueueStats, processQueue } from './offline-queue'

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null)

  const updatePending = useCallback(() => {
    const stats = getQueueStats()
    setPendingCount(stats.pending + stats.failed)
  }, [])

  const syncNow = useCallback(async () => {
    if (isSyncing) return
    setIsSyncing(true)
    setLastSyncResult(null)
    try {
      const results = await processQueue()
      const completed = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      if (failed > 0) {
        setLastSyncResult(`تمت مزامنة ${completed}، فشل ${failed}`)
      } else if (completed > 0) {
        setLastSyncResult(`تمت مزامنة ${completed} بنجاح`)
      }
    } catch (err: any) {
      setLastSyncResult(`خطأ في المزامنة: ${err.message}`)
    }
    setIsSyncing(false)
    updatePending()
  }, [isSyncing, updatePending])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    updatePending()

    const handleOnline = async () => {
      setIsOnline(true)
      const stats = getQueueStats()
      if (stats.pending > 0 || stats.failed > 0) {
        await syncNow()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const interval = setInterval(() => {
      updatePending()
      if (navigator.onLine) {
        const stats = getQueueStats()
        if ((stats.pending > 0 || stats.failed > 0) && !isSyncing) {
          syncNow()
        }
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [syncNow, updatePending, isSyncing])

  return { isOnline, isSyncing, pendingCount, syncNow, lastSyncResult }
}
