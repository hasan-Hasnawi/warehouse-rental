'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScanLine, LogIn, LogOut, Truck, QrCode, Search } from 'lucide-react'

const actionIcons: Record<string, any> = {
  entry: LogIn,
  exit: LogOut,
  shipment_in: Truck,
  shipment_out: Truck,
}

const actionColors: Record<string, string> = {
  entry: 'bg-green-100 text-green-700',
  exit: 'bg-orange-100 text-orange-700',
  shipment_in: 'bg-blue-100 text-blue-700',
  shipment_out: 'bg-purple-100 text-purple-700',
}

const actionLabels: Record<string, string> = {
  entry: 'دخول',
  exit: 'خروج',
  shipment_in: 'شحنة واردة',
  shipment_out: 'شحنة صادرة',
}

export default function GuardAccessPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [qrInput, setQrInput] = useState('')
  const [form, setForm] = useState<{ warehouseId: string; action: string; notes: string }>({ warehouseId: '', action: 'entry', notes: '' })
  const [warehouses, setWarehouses] = useState<any[]>([])

  const load = () => {
    api.guards.getAccessLogs().then(setLogs).catch(console.error)
    api.warehouses.list().then(setWarehouses).catch(console.error)
  }

  useEffect(() => { load() }, [])

  const handleQRSearch = () => {
    try {
      const data = JSON.parse(qrInput)
      if (data.warehouse) {
        const w = warehouses.find(wh => wh.name === data.warehouse || wh.code === data.code)
        if (w) setForm(prev => ({ ...prev, warehouseId: w.id }))
      }
    } catch { /* manual entry */ }
  }

  const handleSubmit = async () => {
    try {
      await api.guards.logAccess(form)
      setShowForm(false)
      setForm({ warehouseId: '', action: 'entry', notes: '' })
      setQrInput('')
      load()
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تسجيل الدخول والخروج</h1>
          <p className="text-gray-500">سجل دخول وخروج المستأجرين والشحنات</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <ScanLine className="w-4 h-4" /> {showForm ? 'إخفاء' : 'تسجيل جديد'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>تسجيل دخول / خروج</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>مسح QR Code أو إدخال يدوي</Label>
              <div className="flex gap-2">
                <Input
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  placeholder="ضع كود QR أو اكتب اسم المخزن..."
                  dir="ltr"
                />
                <Button variant="outline" onClick={handleQRSearch}><QrCode className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>المخزن</Label>
              <select
                value={form.warehouseId}
                onChange={e => setForm({ ...form, warehouseId: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">اختر المخزن</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>نوع الحركة</Label>
              <div className="flex gap-2">
                {(['entry', 'exit', 'shipment_in', 'shipment_out'] as const).map(a => (
                  <Button
                    key={a}
                    variant={form.action === a ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, action: a })}
                    className="flex-1"
                  >
                    {actionLabels[a]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <Button onClick={handleSubmit}>تسجيل</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {logs.map(log => (
          <Card key={log.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = actionIcons[log.action] || LogIn
                  return <Icon className={`w-5 h-5 ${actionColors[log.action]?.split(' ')[1] || ''}`} />
                })()}
                <div>
                  <p className="font-semibold">{log.warehouse?.name || 'مخزن'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('ar-IQ')}
                    {log.notes && ` - ${log.notes}`}
                  </p>
                </div>
              </div>
              <Badge className={actionColors[log.action]}>{actionLabels[log.action]}</Badge>
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد تسجيلات</p>}
      </div>
    </div>
  )
}
