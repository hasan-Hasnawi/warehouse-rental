'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Phone, Calendar, FileText, CreditCard } from 'lucide-react'

export default function AdminClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    api.admin.listUsers().then(users => {
      const u = users.find((u: any) => u.id === params.id)
      if (u) setClient(u)
      else router.push('/admin/clients')
    }).catch(() => router.push('/admin/clients'))
  }, [params.id, router])

  if (!client) return <div className="text-center text-gray-500 py-12">جاري التحميل...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.push('/admin/clients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> العودة للعملاء
      </button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> {client.fullName}</CardTitle>
          <Badge variant={client.isActive ? 'default' : 'secondary'}>{client.isActive ? 'نشط' : 'غير نشط'}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">البريد</p><p className="font-medium" dir="ltr">{client.email}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">الهاتف</p><p className="font-medium">{client.phone}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">تاريخ التسجيل</p><p className="font-medium">{new Date(client.createdAt).toLocaleDateString('ar-IQ')}</p></div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/admin/contracts?clientId=${client.id}`)} className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> عقوده
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/payments?clientId=${client.id}`)} className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> مدفوعاته
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
