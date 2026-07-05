'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'

const severityIcon: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  emergency: AlertCircle,
}

const severityColor: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  emergency: 'bg-red-100 text-red-700',
}

const severityLabels: Record<string, string> = {
  info: 'معلومة',
  warning: 'تنبيه',
  emergency: 'طوارئ',
}

export default function GuardReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ title: string; description: string; severity: string }>({ title: '', description: '', severity: 'info' })

  const load = () => api.guards.getReports().then(setReports).catch(console.error)
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    try {
      await api.guards.createReport(form)
      setShowForm(false)
      setForm({ title: '', description: '', severity: 'info' })
      load()
    } catch (err: any) { alert(err.message) }
  }

  const sendEmergency = async () => {
    const title = prompt('عنوان البلاغ الطارئ:')
    if (!title) return
    const desc = prompt('وصف البلاغ:')
    if (!desc) return
    try {
      await api.guards.createReport({ title, description: desc, severity: 'emergency' })
      alert('تم إرسال البلاغ الطارئ إلى الإدارة')
      load()
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">التقارير والبلاغات</h1>
          <p className="text-gray-500">سجل التقارير اليومية والبلاغات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={sendEmergency} className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> بلاغ طارئ
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>تقرير جديد</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>تقرير جديد</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>الأهمية</Label>
              <div className="flex gap-2">
                {(['info', 'warning', 'emergency'] as const).map(s => (
                  <Button
                    key={s}
                    variant={form.severity === s ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, severity: s })}
                    className="flex-1"
                  >
                    {severityLabels[s]}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={handleSubmit}>حفظ التقرير</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {reports.map(r => {
          const Icon = severityIcon[r.severity] || Info
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-1 ${severityColor[r.severity]?.split(' ')[1] || ''}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold">{r.title}</p>
                      <Badge className={severityColor[r.severity]}>{severityLabels[r.severity]}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {r.guard?.fullName} - {new Date(r.createdAt).toLocaleString('ar-IQ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {reports.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد تقارير</p>}
      </div>
    </div>
  )
}
