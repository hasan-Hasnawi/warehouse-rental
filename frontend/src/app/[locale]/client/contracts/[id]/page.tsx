'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, DollarSign, Warehouse, FileText, Phone, Package, BadgePercent, Shield, CreditCard } from 'lucide-react'

const statusColor: Record<string, string> = { ACTIVE: 'bg-green-100 text-green-700', EXPIRED: 'bg-gray-100 text-gray-700', TERMINATED: 'bg-red-100 text-red-700', PENDING: 'bg-yellow-100 text-yellow-700' }
const statusText: Record<string, string> = { ACTIVE: 'نشط', EXPIRED: 'منتهي', TERMINATED: 'ملغي', PENDING: 'قيد الانتظار' }
const payStatusColor: Record<string, string> = { PAID: 'bg-green-100 text-green-700', PENDING: 'bg-yellow-100 text-yellow-700', OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-700' }
const payStatusText: Record<string, string> = { PAID: 'مدفوع', PENDING: 'معلق', OVERDUE: 'متأخر', CANCELLED: 'ملغي' }

export default function ClientContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    api.contracts.getById(params.id as string).then(setContract).catch(() => router.push('/client/contracts'))
  }, [params.id, router])

  if (!contract) return <div className="text-center text-gray-500 py-12">جاري التحميل...</div>

  const remainingPct = contract.rentAmount > 0 ? (contract.remainingAmount / contract.rentAmount) * 100 : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push('/client/contracts')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> العودة للعقود
      </button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> {contract.contractNo}</CardTitle>
          <Badge className={statusColor[contract.status]}>{statusText[contract.status]}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Warehouse className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">المخزن</p><p className="font-medium">{contract.warehouse?.name} ({contract.warehouse?.city})</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">المدة</p><p className="font-medium">{new Date(contract.startDate).toLocaleDateString('ar-IQ')} → {new Date(contract.endDate).toLocaleDateString('ar-IQ')}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">مبلغ العقد</p><p className="font-medium">{Number(contract.rentAmount).toLocaleString()} دينار</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">المدفوع</p><p className="font-medium text-green-600">{Number(contract.paidAmount || 0).toLocaleString()} دينار</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg col-span-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex justify-between"><p className="text-xs text-gray-500">المبلغ المتبقي</p><p className={`font-bold text-lg ${contract.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{contract.remainingAmount > 0 ? `${Number(contract.remainingAmount).toLocaleString()} دينار` : 'مسدد بالكامل ✓'}</p></div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div className="bg-gradient-to-l from-red-500 to-yellow-400 h-2.5 rounded-full transition-all" style={{ width: `${remainingPct}%` }}></div>
                </div>
              </div>
            </div>
            {contract.discount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <BadgePercent className="w-5 h-5 text-gray-400" />
                <div><p className="text-xs text-gray-500">التخفيض</p><p className="font-medium text-red-600">-{Number(contract.discount).toLocaleString()} دينار</p></div>
              </div>
            )}
            {contract.guardFeeMonthly > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-400" />
                <div><p className="text-xs text-gray-500">أجر الحارس (شهري)</p><p className="font-medium">{Number(contract.guardFeeMonthly).toLocaleString()} دينار</p></div>
              </div>
            )}
            {contract.clientPhone && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div><p className="text-xs text-gray-500">هاتف 1</p><p className="font-medium" dir="ltr">{contract.clientPhone}</p></div>
              </div>
            )}
            {contract.clientPhone2 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div><p className="text-xs text-gray-500">هاتف 2</p><p className="font-medium" dir="ltr">{contract.clientPhone2}</p></div>
              </div>
            )}
          </div>
          {contract.storedMaterials && (
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Package className="w-5 h-5 text-gray-400 mt-0.5" />
              <div><p className="text-xs text-gray-500">المواد المخزنة</p><p className="font-medium">{contract.storedMaterials}</p></div>
            </div>
          )}
          {contract.notes && <p className="text-sm text-gray-500">{contract.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> المدفوعات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!contract.payments || contract.payments.length === 0) && <p className="text-gray-500 text-center py-4">لا توجد مدفوعات</p>}
          {contract.payments?.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{Number(p.amount).toLocaleString()} دينار</span>
                  <Badge className={payStatusColor[p.status]}>{payStatusText[p.status]}</Badge>
                </div>
                <p className="text-xs text-gray-400">{p.method || '—'} • {new Date(p.dueDate).toLocaleDateString('ar-IQ')}</p>
              </div>
              {p.status === 'PENDING' && (
                <Button size="sm" onClick={() => router.push(`/client/pay/${p.id}`)} className="bg-blue-600 hover:bg-blue-700">ادفع الآن</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push('/client/payments')} className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> كل المدفوعات
        </Button>
      </div>
    </div>
  )
}
