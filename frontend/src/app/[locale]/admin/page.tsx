'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, DollarSign, Clock, AlertTriangle, Bell, X, TrendingUp, Calendar, BarChart3, Filter } from 'lucide-react'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [alerts, setAlerts] = useState<{ expiring: any[]; expired: any[] }>({ expiring: [], expired: [] })
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [revenueDetails, setRevenueDetails] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [customResult, setCustomResult] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    api.payments.dashboard().then(setData).catch(console.error)
    api.contracts.expiring().then(setAlerts).catch(console.error)
  }, [])

  const openRevenueModal = async () => {
    setShowRevenueModal(true)
    setDetailLoading(true)
    try {
      const result = await api.payments.dashboardDetails()
      setRevenueDetails(result)
    } catch (err) { console.error(err) }
    finally { setDetailLoading(false) }
  }

  const handleCustomFilter = async () => {
    if (!customStart || !customEnd) return
    try {
      const result = await api.payments.dashboardDetails(`startDate=${customStart}&endDate=${customEnd}`)
      setCustomResult(result.custom)
    } catch (err) { console.error(err) }
  }

  const stats = [
    { label: 'الإيرادات الإجمالية', value: data?.totalRevenue?.toLocaleString() || '0', icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50', onClick: openRevenueModal },
    { label: 'المدفوعات المعلقة', value: data?.pendingRevenue?.toLocaleString() || '0', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'مدفوعات متأخرة', value: data?.overduePayments || '0', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'نسبة الإشغال', value: `${Math.round(data?.occupancyRate || 0)}%`, icon: Building2, color: 'text-yellow-700', bg: 'bg-yellow-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">نظرة عامة</h1>
        <p className="text-gray-500">مؤشرات الأداء الرئيسية للنظام</p>
      </div>

      {(alerts.expiring.length > 0 || alerts.expired.length > 0) && (
        <Card className="border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-all" onClick={() => setShowExpiredModal(true)}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="w-5 h-5" />
              تنبيهات انتهاء العقود
              <span className="mr-auto text-sm font-normal text-orange-600">اضغط لعرض التفاصيل ←</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.expired.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {alerts.expired.length} عقد منتهي
              </div>
            )}
            {alerts.expiring.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                {alerts.expiring.length} عقد سينتهي قريباً
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${stat.onClick ? 'cursor-pointer' : ''}`} onClick={stat.onClick}>
            <CardContent className={`p-6 ${stat.bg} rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color} opacity-30`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>المخازن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>إجمالي المخازن</span>
                <span className="font-bold">{data?.totalWarehouses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>مخازن مؤجرة</span>
                <span className="font-bold">{data?.rentedWarehouses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>العقود النشطة</span>
                <span className="font-bold">{data?.activeContracts || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button onClick={() => router.push('/admin/warehouses')} className="block w-full text-right p-3 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all">
              إدارة المخازن
            </button>
            <button onClick={() => router.push('/admin/contracts')} className="block w-full text-right p-3 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-all">
              إدارة العقود
            </button>
            <button onClick={() => router.push('/admin/payments')} className="block w-full text-right p-3 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-all">
              المدفوعات
            </button>
          </CardContent>
        </Card>
      </div>

      {showRevenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowRevenueModal(false); setCustomResult(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-teal-600" /> تفاصيل الإيرادات</h2>
              <button onClick={() => { setShowRevenueModal(false); setCustomResult(null) }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {detailLoading ? (
                <p className="text-center text-gray-500 py-8">جاري التحميل...</p>
              ) : revenueDetails && (
                <>
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                    <div className="flex items-center gap-2 text-teal-700 font-bold mb-1"><BarChart3 className="w-4 h-4" /> الإيرادات الإجمالية الكاملة</div>
                    <p className="text-2xl font-bold text-teal-600">{revenueDetails.total.toLocaleString()} د.ع</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 font-bold mb-1"><Calendar className="w-4 h-4" /> الإيرادات السنوية ({new Date().getFullYear()})</div>
                    <p className="text-2xl font-bold text-blue-600">{revenueDetails.yearly.toLocaleString()} د.ع</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700 font-bold mb-1"><Calendar className="w-4 h-4" /> الإيرادات الشهرية ({new Date().toLocaleDateString('ar-IQ', { month: 'long' })})</div>
                    <p className="text-2xl font-bold text-purple-600">{revenueDetails.monthly.toLocaleString()} د.ع</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700 font-bold mb-2"><Filter className="w-4 h-4" /> إيرادات فترة مخصصة</div>
                    <div className="flex gap-2 mb-2">
                      <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-sm" />
                      <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-sm" />
                      <Button size="sm" onClick={handleCustomFilter} disabled={!customStart || !customEnd}>عرض</Button>
                    </div>
                    {customResult !== null && (
                      <p className="text-lg font-bold text-orange-600">{customResult.toLocaleString()} د.ع</p>
                    )}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المبالغ المسددة</span>
                      <span className="font-bold text-green-600">{revenueDetails.paid.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>المبالغ غير المسددة</span>
                      <span className="font-bold text-red-600">{revenueDetails.unpaid.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t font-bold">
                      <span>المجموع الكلي</span>
                      <span className="text-teal-600">{revenueDetails.grandTotal.toLocaleString()} د.ع</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowExpiredModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-orange-600" /> العقود المنتهية والمنتهية صلاحيتها</h2>
              <button onClick={() => setShowExpiredModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto">
              {alerts.expired.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-red-700 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    العقود المنتهية ({alerts.expired.length})
                  </h3>
                  <div className="space-y-3">
                    {alerts.expired.map((c: any) => (
                      <div key={c.id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-red-800">{c.warehouse.name} - {c.contractNo}</p>
                            <p className="text-xs text-red-600 mt-0.5">{c.tenant.name} · {c.tenant.phone}</p>
                            <p className="text-xs text-red-500 mt-0.5">
                              من {new Date(c.startDate).toLocaleDateString('ar-IQ')} إلى {new Date(c.endDate).toLocaleDateString('ar-IQ')}
                            </p>
                            <p className="text-xs text-red-600 mt-0.5 font-medium">المبلغ: {c.rentAmount?.toLocaleString()} د.ع</p>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 bg-red-200 text-red-800 text-xs rounded-full h-fit">منتهي</span>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-red-200">
                          <Button size="sm" variant="outline" onClick={() => { setShowExpiredModal(false); router.push(`/admin/contracts/${c.id}`) }}>
                            عرض
                          </Button>
                          <WhatsAppButton phone={c.tenant.phone} name={c.tenant.name} defaultCategory="contracts"
                            presetFields={{ 'رقم العقد': c.contractNo, 'المخزن': c.warehouse.name, 'المبلغ': c.rentAmount.toString() }} size="sm" />
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-100"
                            onClick={async () => { if (confirm(`إنهاء العقد ${c.contractNo}؟`)) { try { await api.contracts.terminate(c.id); api.contracts.expiring().then(setAlerts) } catch (e: any) { alert(e.message) } } }}>
                            إنهاء
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {alerts.expiring.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-orange-700 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    العقود التي ستنتهي قريباً ({alerts.expiring.length})
                  </h3>
                  <div className="space-y-3">
                    {alerts.expiring.map((c: any) => (
                      <div key={c.id} className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-orange-800">{c.warehouse.name} - {c.contractNo}</p>
                            <p className="text-xs text-orange-600 mt-0.5">{c.tenant.name} · {c.tenant.phone}</p>
                            <p className="text-xs text-orange-500 mt-0.5">
                              من {new Date(c.startDate).toLocaleDateString('ar-IQ')} إلى {new Date(c.endDate).toLocaleDateString('ar-IQ')}
                            </p>
                            <p className="text-xs text-orange-600 mt-0.5 font-medium">المبلغ: {c.rentAmount?.toLocaleString()} د.ع</p>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 bg-orange-200 text-orange-800 text-xs rounded-full h-fit">سينتهي قريباً</span>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-orange-200">
                          <Button size="sm" variant="outline" onClick={() => { setShowExpiredModal(false); router.push(`/admin/contracts/${c.id}`) }}>
                            عرض
                          </Button>
                          <WhatsAppButton phone={c.tenant.phone} name={c.tenant.name} defaultCategory="contracts"
                            presetFields={{ 'رقم العقد': c.contractNo, 'المخزن': c.warehouse.name, 'المبلغ': c.rentAmount.toString() }} size="sm" />
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-100"
                            onClick={async () => { if (confirm(`إنهاء العقد ${c.contractNo}؟`)) { try { await api.contracts.terminate(c.id); api.contracts.expiring().then(setAlerts) } catch (e: any) { alert(e.message) } } }}>
                            إنهاء
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {alerts.expired.length === 0 && alerts.expiring.length === 0 && (
                <p className="text-gray-500 text-center py-8">لا توجد عقود منتهية أو وشيكة الانتهاء</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
