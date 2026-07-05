'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
  TERMINATED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
}

const statusText: Record<string, string> = {
  ACTIVE: 'نشط',
  EXPIRED: 'منتهي',
  TERMINATED: 'ملغي',
  PENDING: 'قيد الانتظار',
}

export default function ClientContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    api.contracts.list().then(setContracts).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">عقودي</h1>
      {contracts.length === 0 && <p className="text-gray-500">لا توجد عقود حالية</p>}
      <div className="grid gap-4">
        {contracts.map((c) => (
          <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/client/contracts/${c.id}`)}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{c.warehouse?.name}</p>
                  <p className="text-sm text-gray-500">رقم العقد: {c.contractNo}</p>
                  <p className="text-sm text-gray-500">
                    من {new Date(c.startDate).toLocaleDateString('ar-IQ')} إلى {new Date(c.endDate).toLocaleDateString('ar-IQ')}
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-2">
                    {Number(c.rentAmount).toLocaleString()} / شهرياً
                  </p>
                </div>
                <Badge className={statusColor[c.status]}>{statusText[c.status]}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
