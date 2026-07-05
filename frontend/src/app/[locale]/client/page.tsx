'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Maximize2, DollarSign, Building2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'

const statusColor: Record<string, string> = {
  VACANT: 'bg-green-100 text-green-700',
  RENTED: 'bg-yellow-100 text-yellow-700',
  MAINTENANCE: 'bg-red-100 text-red-700',
}

const statusText: Record<string, string> = {
  VACANT: 'شاغر',
  RENTED: 'مؤجر',
  MAINTENANCE: 'تحت الصيانة',
}

export default function ClientCatalogPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.warehouses.list('status=VACANT').then(setWarehouses).catch(console.error)
  }, [])

  const filtered = warehouses.filter(w =>
    w.name.includes(search) || w.city.includes(search)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">كتالوج المخازن</h1>
        <p className="text-gray-500">المخازن المتاحة للتأجير</p>
      </div>

      <input
        type="text"
        placeholder="بحث عن مخزن..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 border rounded-lg"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{w.name}</CardTitle>
                <Badge className={statusColor[w.status]}>{statusText[w.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{w.city} - {w.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Maximize2 className="w-4 h-4" />
                <span>{w.area} م²</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-teal-600">
                <DollarSign className="w-4 h-4" />
                <span>{Number(w.pricePer6Months || w.pricePerMonth * 6).toLocaleString()} / 6 أشهر</span>
              </div>
              {Array.isArray(w.features) && w.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {w.features.map((f: string) => (
                    <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                  ))}
                </div>
              )}
              <Link href={`/client/book/${w.id}`}>
                <Button className="w-full">حجز المخزن</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-12">لا توجد مخازن متاحة حالياً</p>
        )}
      </div>
    </div>
  )
}
