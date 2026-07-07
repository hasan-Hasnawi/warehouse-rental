'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'

const statusText: Record<string, string> = { ACTIVE: 'نشط', EXPIRED: 'منتهي', TERMINATED: 'ملغي', PENDING: 'قيد الانتظار' }
const payStatusText: Record<string, string> = { PAID: 'مدفوع', PENDING: 'معلق', OVERDUE: 'متأخر', CANCELLED: 'ملغي' }

export default function PrintContractPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    api.contracts.getById(params.id as string).then(setContract).catch(() => router.push('/admin/contracts'))
  }, [params.id, router])

  if (!contract) return <div className="text-center text-gray-500 py-12">جاري التحميل...</div>

  const paidAmount = contract.payments?.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0) || 0
  const remainingAmount = Math.max(0, contract.rentAmount - paidAmount)

  return (
    <div className="max-w-[210mm] mx-auto">
      <div className="flex gap-2 mb-4 print:hidden sticky top-4 z-10">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 ml-1" /> عودة</Button>
        <Button onClick={() => window.print()}><Printer className="w-4 h-4 ml-1" /> طباعة</Button>
      </div>

      <div className="bg-white p-8 md:p-12 shadow-lg rounded-xl" style={{ minHeight: '297mm' }}>
        <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
          <h1 className="text-2xl font-bold mb-1">عقد إيجار مخزن</h1>
          <p className="text-gray-500">Warehouse Rental Agreement</p>
        </div>

        <div className="flex justify-between text-sm text-gray-600 mb-6">
          <div>
            <p className="font-bold text-gray-800">رقم العقد: <span className="font-normal">{contract.contractNo}</span></p>
            <p className="font-bold text-gray-800">تاريخ الإنشاء: <span className="font-normal">{new Date(contract.createdAt).toLocaleDateString('ar-IQ')}</span></p>
          </div>
          <div className="text-left">
            <p className={`px-3 py-1 rounded-full text-sm font-bold ${contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{statusText[contract.status]}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border rounded-lg p-4">
            <h2 className="font-bold text-sm text-gray-600 mb-2">معلومات المستأجر</h2>
            <p className="font-semibold">{contract.client?.fullName}</p>
            <p className="text-sm text-gray-600">هاتف: {contract.clientPhone || contract.client?.phone}</p>
            {contract.clientPhone2 && <p className="text-sm text-gray-600">هاتف 2: {contract.clientPhone2}</p>}
            {contract.client?.email && <p className="text-sm text-gray-600">بريد: {contract.client?.email}</p>}
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="font-bold text-sm text-gray-600 mb-2">معلومات المخزن</h2>
            <p className="font-semibold">{contract.warehouse?.name}</p>
            <p className="text-sm text-gray-600">كود: {contract.warehouse?.code}</p>
            <p className="text-sm text-gray-600">العنوان: {contract.warehouse?.address}</p>
            <p className="text-sm text-gray-600">المدينة: {contract.warehouse?.city}</p>
            {contract.warehouse?.area && <p className="text-sm text-gray-600">المساحة: {contract.warehouse?.area} م²</p>}
          </div>
        </div>

        {contract.warehouse?.group && (
          <div className="border rounded-lg p-4 mb-6">
            <h2 className="font-bold text-sm text-gray-600 mb-2">المجموعة</h2>
            <p>المجموعة: {contract.warehouse.group.name}</p>
            {contract.warehouse.group.investorName && <p className="text-sm text-gray-600">المستثمر: {contract.warehouse.group.investorName}</p>}
          </div>
        )}

        <table className="w-full mb-6 border-collapse">
          <tbody>
            <tr className="border-b">
              <td className="py-2 text-gray-600 font-medium w-1/2">تاريخ البداية</td>
              <td className="py-2 font-semibold">{new Date(contract.startDate).toLocaleDateString('ar-IQ')}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-gray-600 font-medium">تاريخ النهاية</td>
              <td className="py-2 font-semibold">{new Date(contract.endDate).toLocaleDateString('ar-IQ')}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-gray-600 font-medium">مبلغ الإيجار الإجمالي</td>
              <td className="py-2 font-semibold">{Number(contract.rentAmount).toLocaleString()} دينار</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-gray-600 font-medium">التأمين</td>
              <td className="py-2 font-semibold">{Number(contract.depositAmount).toLocaleString()} دينار</td>
            </tr>
            {contract.discount > 0 && (
              <tr className="border-b">
                <td className="py-2 text-gray-600 font-medium">التخفيض</td>
                <td className="py-2 font-semibold text-red-600">-{Number(contract.discount).toLocaleString()} دينار</td>
              </tr>
            )}
            {contract.guardFeeMonthly > 0 && (
              <tr className="border-b">
                <td className="py-2 text-gray-600 font-medium">أجر الحارس (شهري)</td>
                <td className="py-2 font-semibold">{Number(contract.guardFeeMonthly).toLocaleString()} دينار</td>
              </tr>
            )}
            <tr className="border-b">
              <td className="py-2 text-gray-600 font-medium">المبلغ المدفوع</td>
              <td className="py-2 font-semibold text-green-600">{Number(paidAmount).toLocaleString()} دينار</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-gray-600 font-medium">المبلغ المتبقي</td>
              <td className={`py-2 font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{remainingAmount > 0 ? `${Number(remainingAmount).toLocaleString()} دينار` : 'مسدد بالكامل ✓'}</td>
            </tr>
          </tbody>
        </table>

        {contract.storedMaterials && (
          <div className="border rounded-lg p-4 mb-6">
            <h2 className="font-bold text-sm text-gray-600 mb-2">المواد المخزنة</h2>
            <p>{contract.storedMaterials}</p>
          </div>
        )}

        {contract.notes && (
          <div className="border rounded-lg p-4 mb-6">
            <h2 className="font-bold text-sm text-gray-600 mb-2">ملاحظات</h2>
            <p>{contract.notes}</p>
          </div>
        )}

        <div className="border rounded-lg p-4 mb-6">
          <h2 className="font-bold text-sm text-gray-600 mb-3">سجل المدفوعات</h2>
          {(!contract.payments || contract.payments.length === 0) ? (
            <p className="text-sm text-gray-500">لا توجد مدفوعات</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-right py-1">#</th>
                  <th className="text-right py-1">المبلغ</th>
                  <th className="text-right py-1">الحالة</th>
                  <th className="text-right py-1">تاريخ الاستحقاق</th>
                  <th className="text-right py-1">تاريخ الدفع</th>
                </tr>
              </thead>
              <tbody>
                {contract.payments.map((p: any, i: number) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-1">{i + 1}</td>
                    <td className="py-1">{Number(p.amount).toLocaleString()}</td>
                    <td className="py-1">{payStatusText[p.status]}</td>
                    <td className="py-1">{new Date(p.dueDate).toLocaleDateString('ar-IQ')}</td>
                    <td className="py-1">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('ar-IQ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="grid grid-cols-2 gap-12 mt-16 pt-8">
          <div className="text-center">
            <div className="border-t-2 border-gray-800 pt-2">
              <p className="font-bold">توقيع المستأجر</p>
              <p className="text-sm text-gray-500">{contract.client?.fullName}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-800 pt-2">
              <p className="font-bold">توقيع المؤجر</p>
              <p className="text-sm text-gray-500">مدير النظام</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}