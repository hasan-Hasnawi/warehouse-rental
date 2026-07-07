'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CreditCard, User, FileText, Calendar, DollarSign, CheckCircle, Loader2, XCircle } from 'lucide-react'

const statusColor: Record<string, string> = { PAID: 'bg-green-100 text-green-700', PENDING: 'bg-yellow-100 text-yellow-700', OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-700' }
const statusText: Record<string, string> = { PAID: 'مدفوع', PENDING: 'معلق', OVERDUE: 'متأخر', CANCELLED: 'ملغي' }

export default function AdminPaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [payment, setPayment] = useState<any>(null)
  const [marking, setMarking] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!params.id) return
    api.payments.getById(params.id as string).then(setPayment).catch(() => router.push('/admin/payments'))
  }, [params.id, router])

  const handleMarkPaid = async () => {
    if (!confirm('تأكيد استلام الدفعة نقداً؟')) return
    setMarking(true)
    try {
      await api.payments.markAsPaid(params.id as string)
      const updated = await api.payments.getById(params.id as string)
      setPayment(updated)
    } catch (err: any) { alert(err.message) }
    finally { setMarking(false) }
  }

  const handleCancel = async () => {
    if (!confirm('هل أنت متأكد من إلغاء الدفعة؟')) return
    setCancelling(true)
    try {
      await api.payments.cancel(params.id as string)
      const updated = await api.payments.getById(params.id as string)
      setPayment(updated)
    } catch (err: any) { alert(err.message) }
    finally { setCancelling(false) }
  }

  if (!payment) return <div className="text-center text-gray-500 py-12">جاري التحميل...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.push('/admin/payments')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> العودة للمدفوعات
      </button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> دفعة #{payment.id.slice(-6)}</CardTitle>
          <Badge className={statusColor[payment.status]}>{statusText[payment.status]}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold">{Number(payment.amount).toLocaleString()} {payment.currency}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">العميل</p><p className="font-medium">{payment.client?.fullName}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">العقد</p><p className="font-medium">{payment.contract?.contractNo}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">تاريخ الاستحقاق</p><p className="font-medium">{new Date(payment.dueDate).toLocaleDateString('ar-IQ')}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">طريقة الدفع</p><p className="font-medium">{payment.method || '—'}</p></div>
            </div>
          </div>
          {payment.paidAt && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" /> تم الدفع في {new Date(payment.paidAt).toLocaleDateString('ar-IQ')}
              {payment.referenceNo && <span className="text-gray-500">(مرجع: {payment.referenceNo})</span>}
            </div>
          )}
          {payment.description && <p className="text-sm text-gray-500">{payment.description}</p>}
          {payment.status === 'PENDING' && (
            <div className="flex gap-2">
              <Button onClick={handleMarkPaid} disabled={marking || cancelling} className="flex-1 bg-green-600 hover:bg-green-700">
                {marking ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري...</> : <><CheckCircle className="w-4 h-4 ml-1" /> تأكيد الدفع يدوياً (نقدي)</>}
              </Button>
              <Button onClick={handleCancel} disabled={marking || cancelling} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                {cancelling ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري...</> : <><XCircle className="w-4 h-4 ml-1" /> عدم استلام الدفعة</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
