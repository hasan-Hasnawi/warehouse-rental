'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, MapPin, Maximize2, DollarSign } from 'lucide-react'

export default function BookWarehousePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [warehouse, setWarehouse] = useState<any>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (id) api.warehouses.getById(id).then(setWarehouse).catch(console.error)
  }, [id])

  const handleBook = async () => {
    try {
      await api.bookings.create({ warehouseId: id, message })
      router.push('/client/bookings')
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (!warehouse) return <div className="p-6">جاري التحميل...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
        <ArrowRight className="w-4 h-4" /> رجوع
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{warehouse.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" /> {warehouse.city} - {warehouse.address}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Maximize2 className="w-4 h-4" /> {warehouse.area} م²
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
            <DollarSign className="w-4 h-4" /> {Number(warehouse.pricePerMonth).toLocaleString()} شهرياً
          </div>
          {warehouse.description && <p className="text-gray-600">{warehouse.description}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>طلب حجز</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>رسالة إلى الإدارة (اختياري)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="أكتب أي ملاحظات أو طلبات خاصة..."
              rows={4}
            />
          </div>
          <Button onClick={handleBook} className="w-full">إرسال طلب الحجز</Button>
        </CardContent>
      </Card>
    </div>
  )
}
