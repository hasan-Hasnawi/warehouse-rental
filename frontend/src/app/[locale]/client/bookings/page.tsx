'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, DollarSign, XCircle } from 'lucide-react'

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
}

const statusText: Record<string, string> = {
  PENDING: 'معلق',
  APPROVED: 'مقبول',
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغي',
}

export default function ClientBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    api.bookings.list().then(setBookings).catch(console.error)
  }, [])

  const handleCancel = async (id: string) => {
    try {
      await api.bookings.cancel(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">حجوزاتي</h1>
        <p className="text-gray-500">طلبات حجز المخازن الخاصة بك</p>
      </div>

      <div className="space-y-4">
        {bookings.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex items-start justify-between p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{b.warehouse.name}</h3>
                  <Badge className={statusColor[b.status]}>{statusText[b.status]}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{b.warehouse.city}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{Number(b.warehouse.pricePerMonth).toLocaleString()}/شهر</span>
                </div>
                {b.message && <p className="text-sm text-gray-500">الرسالة: {b.message}</p>}
              </div>
              {b.status === 'PENDING' && (
                <Button onClick={() => handleCancel(b.id)} variant="outline" className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" /> إلغاء
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {bookings.length === 0 && <p className="text-gray-500 text-center py-12">لا توجد حجوزات</p>}
      </div>
    </div>
  )
}
