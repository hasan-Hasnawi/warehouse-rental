'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, User, Warehouse, Calendar, DollarSign, BadgePercent, Shield, Phone, Package, CreditCard, Plus } from 'lucide-react'
import WhatsAppButton from '@/components/WhatsAppButton'

const statusColor: Record<string, string> = { ACTIVE: 'bg-green-100 text-green-700', EXPIRED: 'bg-gray-100 text-gray-700', TERMINATED: 'bg-red-100 text-red-700', PENDING: 'bg-yellow-100 text-yellow-700' }
const statusText: Record<string, string> = { ACTIVE: 'نشط', EXPIRED: 'منتهي', TERMINATED: 'ملغي', PENDING: 'قيد الانتظار' }
const payStatusColor: Record<string, string> = { PAID: 'bg-green-100 text-green-700', PENDING: 'bg-yellow-100 text-yellow-700', OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-700' }
const payStatusText: Record<string, string> = { PAID: 'مدفوع', PENDING: 'معلق', OVERDUE: 'متأخر', CANCELLED: 'ملغي' }

export default function AdminContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<any>(null)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payDesc, setPayDesc] = useState('')
  const [payDueDate, setPayDueDate] = useState('')
  const [payLoading, setPayLoading] = useState(false)

  const loadContract = () => {
    if (!params.id) return
    api.contracts.getById(params.id as string).then(setContract).catch(() => router.push('/admin/contracts'))
  }

  useEffect(() => { loadContract() }, [params.id])

  const handleAddPayment = async () => {
    if (!payAmount || !payDueDate) { alert('يرجى تعبئة المبلغ وتاريخ الاستحقاق'); return }
    const amount = parseFloat(payAmount)
    if (amount <= 0 || amount > contract.remainingAmount) {
      alert(`المبلغ يجب أن يكون بين 1 و ${contract.remainingAmount.toLocaleString()}`)
      return
    }
    setPayLoading(true)
    try {
      await api.payments.create({
        contractId: contract.id,
        amount,
        method: payMethod,
        dueDate: payDueDate,
        description: payDesc || `دفعة جزئية - عقد ${contract.contractNo}`,
      })
      setShowAddPayment(false)
      setPayAmount(''); setPayDesc(''); setPayDueDate('')
      loadContract()
    } catch (err: any) { alert(err.message) }
    finally { setPayLoading(false) }
  }

  if (!contract) return <div className="text-center text-gray-500 py-12">جاري التحميل...</div>

  const remainingPct = contract.rentAmount > 0 ? (contract.remainingAmount / contract.rentAmount) * 100 : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push('/admin/contracts')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> العودة للعقود
      </button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> {contract.contractNo}</CardTitle>
          <div className="flex items-center gap-2">
            <WhatsAppButton
              phone={contract.clientPhone || contract.client?.phone || ''}
              name={contract.client?.fullName || ''}
              defaultCategory="contracts"
              presetFields={{ amount: String(contract.rentAmount || ''), contractNo: contract.contractNo, warehouse: contract.warehouse?.name || '', date: new Date(contract.endDate).toLocaleDateString('ar-IQ') }}
            />
            <Badge className={statusColor[contract.status]}>{statusText[contract.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">المستأجر</p><p className="font-medium">{contract.client?.fullName}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Warehouse className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">المخزن</p><p className="font-medium">{contract.warehouse?.name}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">تاريخ البداية</p><p className="font-medium">{new Date(contract.startDate).toLocaleDateString('ar-IQ')}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">تاريخ النهاية</p><p className="font-medium">{new Date(contract.endDate).toLocaleDateString('ar-IQ')}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">مبلغ العقد</p><p className="font-medium">{Number(contract.rentAmount).toLocaleString()} دينار</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">المبلغ المدفوع</p><p className="font-medium text-green-600">{Number(contract.paidAmount || 0).toLocaleString()} دينار</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg col-span-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex justify-between"><p className="text-xs text-gray-500">المبلغ المتبقي</p><p className={`font-bold text-lg ${contract.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{contract.remainingAmount > 0 ? `${Number(contract.remainingAmount).toLocaleString()} دينار` : 'مسدد بالكامل ✓'}</p></div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div className="bg-gradient-to-l from-red-500 to-yellow-400 h-2.5 rounded-full transition-all" style={{ width: `${remainingPct}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{remainingPct.toFixed(0)}% متبقي</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">تأمين</p><p className="font-medium">{Number(contract.depositAmount).toLocaleString()} دينار</p></div>
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
          {contract.notes && <p className="text-sm text-gray-500">ملاحظات: {contract.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> المدفوعات</CardTitle>
          <Button size="sm" onClick={() => setShowAddPayment(!showAddPayment)} className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> إضافة دفعة
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddPayment && (
            <Card className="border-2 border-yellow-300 bg-yellow-50">
              <CardContent className="p-4 space-y-3">
                <p className="font-semibold text-sm">دفعة جديدة - المتبقي: {Number(contract.remainingAmount).toLocaleString()} دينار</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>المبلغ</Label><Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} max={contract.remainingAmount} /></div>
                  <div className="space-y-1"><Label>تاريخ الاستحقاق</Label><Input type="date" value={payDueDate} onChange={e => setPayDueDate(e.target.value)} /></div>
                </div>
                <div className="space-y-1"><Label>طريقة الدفع</Label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                    <option value="cash">نقدي</option>
                    <option value="ki_card">كي كارد</option>
                    <option value="zaincash">زينكاش</option>
                    <option value="bank">تحويل بنكي</option>
                  </select>
                </div>
                <div className="space-y-1"><Label>الوصف</Label><Input value={payDesc} onChange={e => setPayDesc(e.target.value)} placeholder="وصف الدفعة..." /></div>
                <div className="flex gap-2">
                  <Button onClick={handleAddPayment} disabled={payLoading}>{payLoading ? 'جاري...' : 'إضافة الدفعة'}</Button>
                  <Button variant="outline" onClick={() => setShowAddPayment(false)}>إلغاء</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(!contract.payments || contract.payments.length === 0) && <p className="text-gray-500 text-center py-4">لا توجد مدفوعات</p>}
          {contract.payments?.map((p: any, i: number) => {
            const runningBalance = contract.rentAmount - contract.payments
              .filter((pp: any, j: number) => pp.status === 'PAID' && j <= i)
              .reduce((sum: number, pp: any) => sum + pp.amount, 0)
            return (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => router.push(`/admin/payments/${p.id}`)}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{Number(p.amount).toLocaleString()} دينار</span>
                    <Badge className={payStatusColor[p.status]}>{payStatusText[p.status]}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">{p.method || '—'} • {new Date(p.dueDate).toLocaleDateString('ar-IQ')}{p.paidAt ? ` • مدفوعة: ${new Date(p.paidAt).toLocaleDateString('ar-IQ')}` : ''}</p>
                </div>
                <p className="text-xs text-gray-400"># ت{p.id.slice(-4)}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
