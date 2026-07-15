'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, Filter, Info, AlertTriangle, AlertCircle, Siren, Trash2 } from 'lucide-react'

const typeIcon: Record<string, any> = { info: Info, alert: AlertTriangle, emergency: Siren, reminder: Bell }
const typeColor: Record<string, string> = { info: 'bg-blue-100 text-blue-700', alert: 'bg-orange-100 text-orange-700', emergency: 'bg-red-100 text-red-700', reminder: 'bg-gray-100 text-gray-700' }

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  const load = () => {
    const params = filter === 'all' ? '' : `?type=${filter}`
    api.notifications.list(params).then(setNotifications).catch(console.error)
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id)
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err: any) { alert(err.message) }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead()
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    } catch (err: any) { alert(err.message) }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.size} إشعار؟`)) return
    try {
      await api.notifications.delete(Array.from(selectedIds))
      setSelectedIds(new Set())
      load()
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6" /> الإشعارات</h1>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button onClick={handleDeleteSelected} variant="destructive" className="flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> حذف المحدد ({selectedIds.size})
            </Button>
          )}
          <Button onClick={handleMarkAllAsRead} variant="outline" className="flex items-center gap-1">
            <CheckCheck className="w-4 h-4" /> تعليم الكل مقروء
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'info', 'alert', 'reminder', 'emergency'].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === t ? 'bg-yellow-400 text-yellow-950 shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'all' ? 'الكل' : t === 'info' ? 'معلومات' : t === 'alert' ? 'تنبيهات' : t === 'reminder' ? 'تذكيرات' : 'طوارئ'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {notifications.map(n => {
          const Icon = typeIcon[n.type] || Bell
          return (
            <Card key={n.id} className={`transition-all ${n.isRead ? 'opacity-70' : 'border-r-4 border-yellow-400 shadow-sm'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selectedIds.has(n.id)} onChange={() => toggleSelect(n.id)} className="mt-1 w-4 h-4 rounded border-gray-300" />
                  <div className={`p-2 rounded-full ${typeColor[n.type] || 'bg-gray-100'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-yellow-400"></span>}
                      <Badge className={typeColor[n.type] || 'bg-gray-100'}>{n.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('ar-IQ')} - {new Date(n.createdAt).toLocaleTimeString('ar-IQ')}</p>
                  </div>
                  {!n.isRead && (
                    <button onClick={() => handleMarkAsRead(n.id)} className="p-1 hover:bg-gray-100 rounded text-xs text-gray-400 hover:text-gray-600">
                      تعليم مقروء
                    </button>
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
