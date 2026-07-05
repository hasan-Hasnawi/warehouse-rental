'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'

const statusColor: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
}

const statusText: Record<string, string> = {
  PAID: 'مدفوع', PENDING: 'معلق', OVERDUE: 'متأخر', CANCELLED: 'ملغي',
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    api.payments.list().then(setPayments).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المدفوعات</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(payments, [{ header:'المبلغ',key:'amount' },{ header:'العملة',key:'currency' },{ header:'المستأجر',key:'client',render:(_,r)=>r.client?.fullName },{ header:'العقد',key:'contract',render:(_,r)=>r.contract?.contractNo },{ header:'طريقة الدفع',key:'method' },{ header:'الحالة',key:'status',render:(v)=>statusText[v]||v }], 'المدفوعات')}><FileDown className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('المدفوعات', payments, [{ header:'المبلغ',key:'amount' },{ header:'المستأجر',key:'client',render:(_,r)=>r.client?.fullName },{ header:'العقد',key:'contract',render:(_,r)=>r.contract?.contractNo },{ header:'طريقة الدفع',key:'method' },{ header:'الحالة',key:'status',render:(v)=>statusText[v]||v }], 'المدفوعات')}><FileDown className="w-4 h-4" /> PDF</Button>
        </div>
      </div>
      <div className="grid gap-3">
        {payments.map(p => (
          <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/admin/payments/${p.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{Number(p.amount).toLocaleString()} {p.currency}</p>
                    <Badge className={statusColor[p.status]}>{statusText[p.status]}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{p.client?.fullName} - {p.contract?.contractNo}</p>
                  <p className="text-xs text-gray-400">
                    {p.method} - {p.paidAt ? new Date(p.paidAt).toLocaleDateString('ar-IQ') : `استحقاق: ${new Date(p.dueDate).toLocaleDateString('ar-IQ')}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {payments.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد مدفوعات</p>}
      </div>
    </div>
  )
}
