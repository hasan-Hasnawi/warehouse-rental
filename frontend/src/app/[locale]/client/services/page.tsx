'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

const serviceLabels: Record<string, string> = {
  cleaning: 'نظافة',
  security: 'أمن',
  maintenance: 'صيانة',
  other: 'أخرى',
}

export default function ClientServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [form, setForm] = useState({ serviceType: 'cleaning', description: '' })
  const [showForm, setShowForm] = useState(false)

  const load = () => api.services.list().then(setServices).catch(console.error)
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    try {
      await api.services.create(form)
      setForm({ serviceType: 'cleaning', description: '' })
      setShowForm(false)
      load()
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">خدمات إضافية</h1>
        <Button onClick={() => setShowForm(!showForm)}>طلب خدمة جديدة</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>طلب خدمة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>نوع الخدمة</Label>
              <select
                value={form.serviceType}
                onChange={e => setForm({ ...form, serviceType: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="cleaning">نظافة</option>
                <option value="security">أمن</option>
                <option value="maintenance">صيانة</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>إرسال الطلب</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {services.map(s => (
          <Card key={s.id}>
            <CardContent className="p-6 flex items-start justify-between">
              <div>
                <p className="font-semibold">{serviceLabels[s.serviceType] || s.serviceType}</p>
                <p className="text-sm text-gray-500">{s.description}</p>
                <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString('ar-IQ')}</p>
              </div>
              <Badge className={statusColor[s.status]}>{s.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {services.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد خدمات مسجلة</p>}
      </div>
    </div>
  )
}
