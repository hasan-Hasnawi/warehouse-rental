'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Phone, Calendar, FileText, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const statusColor: Record<string, string> = { ACTIVE: 'bg-green-100 text-green-700', EXPIRED: 'bg-gray-100 text-gray-700', TERMINATED: 'bg-red-100 text-red-700' }
const statusText: Record<string, string> = { ACTIVE: 'نشط', EXPIRED: 'منتهي', TERMINATED: 'ملغي' }

export default function AdminTenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tenant, setTenant] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    api.tenants.getById(params.id as string).then(setTenant).catch(() => router.push('/admin/tenants'))
  }, [params.id, router])

  if (!tenant) return <div className="text-center text-gray-500 py-12">جاري التحميل...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push('/admin/tenants')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> العودة للمستأجرين
      </button>

      <Card>
        <CardHeader>
          <CardTitle>{tenant.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {tenant.phone && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div><p className="text-xs text-gray-500">رقم الهاتف 1</p><p className="font-medium" dir="ltr">{tenant.phone}</p></div>
              </div>
            )}
            {tenant.phone2 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div><p className="text-xs text-gray-500">رقم الهاتف 2</p><p className="font-medium" dir="ltr">{tenant.phone2}</p></div>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">تاريخ التسجيل</p><p className="font-medium">{new Date(tenant.createdAt).toLocaleDateString('ar-IQ')}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> العقود</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(!tenant.contracts || tenant.contracts.length === 0) && <p className="text-gray-500 text-center py-4">لا توجد عقود</p>}
          {tenant.contracts?.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => router.push(`/admin/contracts/${c.id}`)}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.contractNo}</span>
                  <Badge className={statusColor[c.status]}>{statusText[c.status]}</Badge>
                </div>
                <p className="text-xs text-gray-400">{c.warehouse?.name} • {new Date(c.startDate).toLocaleDateString('ar-IQ')} → {new Date(c.endDate).toLocaleDateString('ar-IQ')}</p>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{Number(c.rentAmount).toLocaleString()} دينار</p>
                <p className={`text-xs ${c.remainingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>{c.remainingAmount > 0 ? `${Number(c.remainingAmount).toLocaleString()} متبقي` : 'مسدد'}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
