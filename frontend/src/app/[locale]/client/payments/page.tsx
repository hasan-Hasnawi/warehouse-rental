'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard } from 'lucide-react'

const statusColor: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
}

const statusText: Record<string, string> = {
  PAID: 'مدفوع',
  PENDING: 'معلق',
  OVERDUE: 'متأخر',
  CANCELLED: 'ملغي',
}

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    api.payments.list().then(setPayments).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مدفوعاتي</h1>
      {payments.length === 0 && <p className="text-gray-500">لا توجد مدفوعات</p>}
      <div className="grid gap-4">
        {payments.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{Number(p.amount).toLocaleString()} {p.currency}</p>
                  <p className="text-sm text-gray-500">طريقة الدفع: {p.method || '—'}</p>
                  <p className="text-sm text-gray-500">تاريخ الاستحقاق: {new Date(p.dueDate).toLocaleDateString('ar-IQ')}</p>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor[p.status]}>{statusText[p.status]}</Badge>
                  {p.status === 'PENDING' && (
                    <Button size="sm" onClick={() => router.push(`/client/pay/${p.id}`)} className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" /> ادفع الآن
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
