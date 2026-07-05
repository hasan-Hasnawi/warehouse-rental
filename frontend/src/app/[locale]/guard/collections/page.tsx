'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, DollarSign } from 'lucide-react'

const methodLabels: Record<string, string> = {
  cash: 'نقدي',
  ki_card: 'كي كارد',
  zaincash: 'زينكاش',
}

export default function GuardCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ amount: string; note: string; method: string }>({ amount: '', note: '', method: 'cash' })

  const load = () => api.guards.getCollections().then(setCollections).catch(console.error)
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!form.amount) return
    try {
      await api.guards.createCollection({ amount: parseFloat(form.amount), method: form.method, note: form.note })
      setShowForm(false)
      setForm({ amount: '', note: '', method: 'cash' })
      load()
    } catch (err: any) { alert(err.message) }
  }

  const totalToday = collections
    .filter(c => new Date(c.collectedAt).toDateString() === new Date().toDateString())
    .reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التحصيلات</h1>
          <p className="text-gray-500">إجمالي اليوم: <span className="font-bold text-green-600">{totalToday.toLocaleString()} د.ع</span></p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Wallet className="w-4 h-4" /> تسجيل تحصيل
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>تسجيل تحصيل نقدي</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="المبلغ بالدينار العراقي" />
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <div className="flex gap-2">
                {(['cash', 'ki_card', 'zaincash'] as const).map(m => (
                  <Button key={m} variant={form.method === m ? 'default' : 'outline'} onClick={() => setForm({ ...form, method: m })} className="flex-1">
                    {methodLabels[m]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="اسم المستأجر أو ملاحظة..." />
            </div>
            <Button onClick={handleSubmit}>تسجيل</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {collections.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold">{Number(c.amount).toLocaleString()} د.ع</p>
                  <p className="text-xs text-gray-500">
                    {c.client?.fullName || c.note || 'غير محدد'}
                    {' - '}
                    {new Date(c.collectedAt).toLocaleString('ar-IQ')}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{methodLabels[c.method] || c.method}</Badge>
            </CardContent>
          </Card>
        ))}
        {collections.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد تحصيلات</p>}
      </div>
    </div>
  )
}
