'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Info, AlertTriangle, Siren, CheckCheck } from 'lucide-react'

const typeIcon: Record<string, any> = { info: Info, alert: AlertTriangle, emergency: Siren, reminder: Bell }
const typeColor: Record<string, string> = { info: 'bg-blue-100 text-blue-700', alert: 'bg-orange-100 text-orange-700', emergency: 'bg-red-100 text-red-700', reminder: 'bg-gray-100 text-gray-700' }

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => { api.notifications.list().then(setNotifications).catch(console.error) }, [])

  const handleMarkAsRead = async (id: string) => {
    try { await api.notifications.markAsRead(id); setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n)) }
    catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الإشعارات</h1>
      <div className="space-y-2">
        {notifications.map(n => {
          const Icon = typeIcon[n.type] || Bell
          return (
            <Card key={n.id} className={`transition-all ${n.isRead ? 'opacity-70' : 'border-r-4 border-teal-400'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${typeColor[n.type] || 'bg-gray-100'}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
                    </div>
                    <p className="text-sm text-gray-500">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('ar-IQ')}</p>
                  </div>
                  {!n.isRead && (
                    <button onClick={() => handleMarkAsRead(n.id)} className="p-1 hover:bg-gray-100 rounded text-xs text-gray-400"><CheckCheck className="w-4 h-4" /></button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {notifications.length === 0 && <p className="text-gray-500 text-center py-12">لا توجد إشعارات</p>}
      </div>
    </div>
  )
}
