'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const methodIcons: Record<string, string> = { ki_card: '💳', zaincash: '📱', cash: '💵', bank: '🏦' }
const methodNames: Record<string, string> = { ki_card: 'كي كارد', zaincash: 'زينكاش', cash: 'نقدي', bank: 'تحويل بنكي' }

export default function PayPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [payment, setPayment] = useState<any>(null)
  const [methods, setMethods] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; referenceNo?: string } | null>(null)

  useEffect(() => {
    if (!id) return
    api.payments.getById(id).then(setPayment).catch(() => router.push('/client/payments'))
    api.payments.getMethods().then(setMethods).catch(console.error)
  }, [id, router])

  if (!payment) return <div className="p-6 text-center text-gray-500">جاري التحميل...</div>
  if (payment.status !== 'PENDING') {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-semibold">هذه الفاتورة {payment.status === 'PAID' ? 'مدفوعة' : 'ملغية'}</p>
            <Button onClick={() => router.push('/client/payments')}>العودة للمدفوعات</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePay = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await api.payments.pay(id, selected)
      setResult(res)
    } catch (err: any) {
      setResult({ success: false, message: err.message })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => router.push('/client/payments')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> العودة للمدفوعات
      </button>

      <Card>
        <CardHeader>
          <CardTitle>إتمام الدفع</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <p className="text-2xl font-bold text-center">{Number(payment.amount).toLocaleString()} {payment.currency}</p>
            {payment.description && <p className="text-sm text-gray-500 text-center">{payment.description}</p>}
            <p className="text-sm text-gray-400 text-center">تاريخ الاستحقاق: {new Date(payment.dueDate).toLocaleDateString('ar-IQ')}</p>
          </div>

          {!result && (
            <>
              <div className="space-y-2">
                <p className="font-medium">اختر طريقة الدفع:</p>
                <div className="grid gap-2">
                  {methods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelected(m.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-right ${selected === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="text-2xl">{m.logo}</span>
                      <span className="font-medium">{m.name}</span>
                      {selected === m.id && <CheckCircle className="w-5 h-5 text-blue-500 mr-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handlePay} disabled={!selected || loading} className="w-full">
                {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري المعالجة...</> : 'تأكيد الدفع'}
              </Button>
            </>
          )}

          {result && (
            <div className={`p-4 rounded-lg text-center space-y-2 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {result.success ? <CheckCircle className="w-10 h-10 text-green-500 mx-auto" /> : <XCircle className="w-10 h-10 text-red-500 mx-auto" />}
              <p className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>{result.message}</p>
              {result.referenceNo && <p className="text-xs text-gray-500">رقم المرجع: {result.referenceNo}</p>}
              <Button onClick={() => router.push('/client/payments')} className="mt-3">العودة للمدفوعات</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
