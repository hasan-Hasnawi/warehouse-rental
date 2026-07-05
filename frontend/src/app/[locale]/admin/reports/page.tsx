'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Users, Package, CreditCard, TrendingUp, DollarSign } from 'lucide-react'

export default function AdminReportsPage() {
  const [dash, setDash] = useState<any>(null)

  useEffect(() => {
    api.payments.dashboard().then(setDash).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500">إجمالي الإيرادات</p><p className="text-xl font-bold">{dash ? Number(dash.totalRevenue).toLocaleString() : '—'}</p></div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500">الإيرادات المعلقة</p><p className="text-xl font-bold">{dash ? Number(dash.pendingRevenue).toLocaleString() : '—'}</p></div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500">العقود النشطة</p><p className="text-xl font-bold">{dash?.activeContracts || '—'}</p></div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500">نسبة الإشغال</p><p className="text-xl font-bold">{dash ? `${Math.round(dash.occupancyRate)}%` : '—'}</p></div>
              <BarChart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Package className="w-4 h-4" /> المخازن</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>الإجمالي</span><span className="font-semibold">{dash?.totalWarehouses || 0}</span></div>
            <div className="flex justify-between"><span>المؤجرة</span><span className="font-semibold">{dash?.rentedWarehouses || 0}</span></div>
            <div className="flex justify-between"><span>الشاغرة</span><span className="font-semibold">{(dash?.totalWarehouses || 0) - (dash?.rentedWarehouses || 0)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4" /> المدفوعات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>المدفوعات المتأخرة</span><span className="font-semibold text-red-600">{dash?.overduePayments || 0}</span></div>
            <div className="flex justify-between"><span>العقود النشطة</span><span className="font-semibold">{dash?.activeContracts || 0}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FileText(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>}
