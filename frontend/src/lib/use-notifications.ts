'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const res = await api.notifications.unreadCount()
      setUnreadCount(res.count)
    } catch {
      setUnreadCount(0)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  return { unreadCount, refresh }
}
