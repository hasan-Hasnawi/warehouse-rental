'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'

const statusText: Record<string, string> = { ACTIVE: 'نشط', EXPIRED: 'منتهي', TERMINATED: 'ملغي', PENDING: 'قيد الانتظار' }
const isPaid = (p: any) => p.status === 'PAID'

export default function PrintContractPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    api.contracts.getById(params.id as string).then(setContract).catch(() => router.push('/admin/contracts'))
  }, [params.id, router])

  if (!contract) return <div className="text-center text-gray-500 py-12">جاري التحميل...</div>

  const paidPayments = contract.payments?.filter(isPaid) || []
  const paidAmount = paidPayments.reduce((s: number, p: any) => s + p.amount, 0)
  const remainingAmount = Math.max(0, contract.rentAmount - paidAmount)

  return (
    <>
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="max-w-[210mm] mx-auto">
        <div className="flex gap-2 mb-4 print:hidden sticky top-4 z-10">
          <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 ml-1" /> عودة</Button>
          <Button onClick={() => window.print()}><Printer className="w-4 h-4 ml-1" /> طباعة</Button>
        </div>

        <div className="bg-white p-4 shadow-lg rounded-xl" style={{ minHeight: '297mm' }}>
          <div className="text-center border-b border-gray-800 pb-2 mb-3">
            <h1 className="text-xl font-bold">عقد إيجار مخزن</h1>
            <p className="text-xs text-gray-500">Warehouse Rental Agreement</p>
          </div>

          <div className="flex justify-between text-xs text-gray-600 mb-3">
            <div>
              <p><span className="font-bold text-gray-800">رقم العقد:</span> {contract.contractNo}</p>
              <p><span className="font-bold text-gray-800">التاريخ:</span> {new Date(contract.createdAt).toLocaleDateString('ar-IQ')}</p>
            </div>
            <div className="text-left">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{statusText[contract.status]}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="border rounded p-2">
              <h2 className="font-bold text-xs text-gray-600 mb-1">المستأجر</h2>
              <p className="text-sm font-semibold">{contract.client?.fullName}</p>
              <p className="text-xs text-gray-600">هاتف: {contract.clientPhone || contract.client?.phone}{contract.clientPhone2 ? ` / ${contract.clientPhone2}` : ''}</p>
              {contract.client?.email && <p className="text-xs text-gray-600">بريد: {contract.client?.email}</p>}
            </div>
            <div className="border rounded p-2">
              <h2 className="font-bold text-xs text-gray-600 mb-1">المخزن</h2>
              <p className="text-sm font-semibold">{contract.warehouse?.name}</p>
              <p className="text-xs text-gray-600">كود: {contract.warehouse?.code} | {contract.warehouse?.city}</p>
              <p className="text-xs text-gray-600">{contract.warehouse?.address}{contract.warehouse?.area ? ` (${contract.warehouse.area} م²)` : ''}</p>
              {contract.warehouse?.group && <p className="text-xs text-gray-600">المجموعة: {contract.warehouse.group.name}{contract.warehouse.group.investorName ? ` | مستثمر: ${contract.warehouse.group.investorName}` : ''}</p>}
            </div>
          </div>

          <table className="w-full mb-3 border-collapse text-xs">
            <tbody>
              <tr className="border-b">
                <td className="py-1 text-gray-600 font-medium w-1/2">تاريخ البداية</td>
                <td className="py-1 font-semibold">{new Date(contract.startDate).toLocaleDateString('ar-IQ')}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1 text-gray-600 font-medium">تاريخ النهاية</td>
                <td className="py-1 font-semibold">{new Date(contract.endDate).toLocaleDateString('ar-IQ')}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1 text-gray-600 font-medium">مبلغ الإيجار</td>
                <td className="py-1 font-semibold">{Number(contract.rentAmount).toLocaleString()} دينار</td>
              </tr>
              <tr className="border-b">
                <td className="py-1 text-gray-600 font-medium">التأمين</td>
                <td className="py-1 font-semibold">{Number(contract.depositAmount).toLocaleString()} دينار</td>
              </tr>
              {contract.discount > 0 && (
                <tr className="border-b">
                  <td className="py-1 text-gray-600 font-medium">التخفيض</td>
                  <td className="py-1 font-semibold text-red-600">-{Number(contract.discount).toLocaleString()} دينار</td>
                </tr>
              )}
              {contract.guardFeeMonthly > 0 && (
                <tr className="border-b">
                  <td className="py-1 text-gray-600 font-medium">أجر الحارس (شهري)</td>
                  <td className="py-1 font-semibold">{Number(contract.guardFeeMonthly).toLocaleString()} دينار</td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-1 text-gray-600 font-medium">المدفوع</td>
                <td className="py-1 font-semibold text-green-600">{Number(paidAmount).toLocaleString()} دينار</td>
              </tr>
              <tr className="border-b">
                <td className="py-1 text-gray-600 font-medium">المتبقي</td>
                <td className={`py-1 font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{remainingAmount > 0 ? `${Number(remainingAmount).toLocaleString()} دينار` : 'مسدد بالكامل'}</td>
              </tr>
            </tbody>
          </table>

          {contract.storedMaterials && (
            <div className="border rounded p-2 mb-2">
              <h2 className="font-bold text-xs text-gray-600 mb-1">المواد المخزنة</h2>
              <p className="text-xs">{contract.storedMaterials}</p>
            </div>
          )}

          {contract.notes && (
            <div className="border rounded p-2 mb-2">
              <h2 className="font-bold text-xs text-gray-600 mb-1">ملاحظات</h2>
              <p className="text-xs">{contract.notes}</p>
            </div>
          )}

          <div className="border rounded p-2 mb-2">
            <h2 className="font-bold text-xs text-gray-600 mb-1">سجل الدفعات المدفوعة</h2>
            {paidPayments.length === 0 ? (
              <p className="text-xs text-gray-500">لا توجد دفعات مدفوعة</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-right py-0.5">#</th>
                    <th className="text-right py-0.5">المبلغ</th>
                    <th className="text-right py-0.5">تاريخ الاستحقاق</th>
                    <th className="text-right py-0.5">تاريخ الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {paidPayments.map((p: any, i: number) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-0.5">{i + 1}</td>
                      <td className="py-0.5">{Number(p.amount).toLocaleString()}</td>
                      <td className="py-0.5">{new Date(p.dueDate).toLocaleDateString('ar-IQ')}</td>
                      <td className="py-0.5">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('ar-IQ') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 mt-6 pt-3">
            <div className="text-center">
              <div className="border-t border-gray-800 pt-1">
                <p className="text-xs font-bold">توقيع المستأجر</p>
                <p className="text-xs text-gray-500">{contract.client?.fullName}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-800 pt-1">
                <p className="text-xs font-bold">توقيع المؤجر</p>
                <p className="text-xs text-gray-500">مدير النظام</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}