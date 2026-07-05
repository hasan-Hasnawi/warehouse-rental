'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileDown, Plus, Filter } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'
import WhatsAppButton from '@/components/WhatsAppButton'

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
  TERMINATED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
}

const statusText: Record<string, string> = {
  ACTIVE: 'نشط', EXPIRED: 'منتهي', TERMINATED: 'ملغي', PENDING: 'قيد الانتظار',
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [filterTab, setFilterTab] = useState<'all' | 'incomplete' | 'active' | 'expiring' | 'expired'>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const router = useRouter()

  const now = new Date()
  const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)

  useEffect(() => {
    api.contracts.list().then(setContracts).catch(console.error)
  }, [])

  const counts = {
    active: contracts.filter(c => c.status === 'ACTIVE').length,
    expiring: contracts.filter(c => c.status === 'ACTIVE' && new Date(c.endDate) <= tenDaysFromNow).length,
    expired: contracts.filter(c => c.status === 'EXPIRED').length,
    incomplete: contracts.filter(c => c.remainingAmount > 0 && c.status !== 'TERMINATED' && c.status !== 'EXPIRED').length,
  }

  const filtered = contracts
    .filter(c => {
      if (filterTab === 'incomplete') return c.remainingAmount > 0 && c.status !== 'TERMINATED' && c.status !== 'EXPIRED'
      if (filterTab === 'active') return c.status === 'ACTIVE'
      if (filterTab === 'expiring') return c.status === 'ACTIVE' && new Date(c.endDate) <= tenDaysFromNow
      if (filterTab === 'expired') return c.status === 'EXPIRED'
      return true
    })
    .sort((a, b) => {
      const pctA = a.rentAmount > 0 ? (a.paidAmount || 0) / a.rentAmount : 0
      const pctB = b.rentAmount > 0 ? (b.paidAmount || 0) / b.rentAmount : 0
      return sortOrder === 'desc' ? pctB - pctA : pctA - pctB
    })

  const handleTerminate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('هل أنت متأكد من إنهاء هذا العقد؟')) return
    try { await api.contracts.terminate(id); setContracts(contracts.map(c => c.id === id ? { ...c, status: 'TERMINATED' } : c)) }
    catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">العقود</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(contracts, [{ header:'رقم العقد',key:'contractNo' },{ header:'المستأجر',key:'client',render:(_,r)=>r.client?.fullName },{ header:'المخزن',key:'warehouse',render:(_,r)=>r.warehouse?.name },{ header:'المدة',key:'status',render:(_,r)=>`${new Date(r.startDate).toLocaleDateString('ar-IQ')}→${new Date(r.endDate).toLocaleDateString('ar-IQ')}` },{ header:'الإيجار',key:'rentAmount' },{ header:'المدفوع',key:'paidAmount' },{ header:'المتبقي',key:'remainingAmount' },{ header:'الحالة',key:'status',render:(v)=>statusText[v]||v }], 'العقود')}><FileDown className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('العقود', contracts, [{ header:'رقم العقد',key:'contractNo' },{ header:'المستأجر',key:'client',render:(_,r)=>r.client?.fullName },{ header:'المخزن',key:'warehouse',render:(_,r)=>r.warehouse?.name },{ header:'الإيجار',key:'rentAmount' },{ header:'المدفوع',key:'paidAmount' },{ header:'المتبقي',key:'remainingAmount' }], 'العقود')}><FileDown className="w-4 h-4" /> PDF</Button>
          <Button onClick={() => router.push('/admin/contracts/create')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> إنشاء عقد
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-1 flex-wrap">
          <button onClick={() => setFilterTab('all')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterTab === 'all' ? 'bg-white shadow-sm text-yellow-800' : 'text-gray-600 hover:text-gray-800'}`}>الكل ({contracts.length})</button>
          <button onClick={() => setFilterTab('incomplete')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterTab === 'incomplete' ? 'bg-white shadow-sm text-yellow-800' : 'text-gray-600 hover:text-gray-800'}`}>غير مكتملة الدفع ({counts.incomplete})</button>
          <button onClick={() => setFilterTab('active')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterTab === 'active' ? 'bg-white shadow-sm text-green-800' : 'text-gray-600 hover:text-gray-800'}`}>فعالة ({counts.active})</button>
          <button onClick={() => setFilterTab('expiring')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterTab === 'expiring' ? 'bg-white shadow-sm text-orange-800' : 'text-gray-600 hover:text-gray-800'}`}>على وشك النفاذ ({counts.expiring})</button>
          <button onClick={() => setFilterTab('expired')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterTab === 'expired' ? 'bg-white shadow-sm text-red-800' : 'text-gray-600 hover:text-gray-800'}`}>منتهية ({counts.expired})</button>
        </div>

        {filterTab === 'incomplete' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')} className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="desc">من الأعلى نسبة سداد</option>
              <option value="asc">من الأقل نسبة سداد</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {filtered.map(c => {
          const payPct = c.rentAmount > 0 ? ((c.paidAmount || 0) / c.rentAmount) * 100 : 0
          return (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/admin/contracts/${c.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{c.contractNo}</p>
                      <Badge className={statusColor[c.status]}>{statusText[c.status]}</Badge>
                      {c.remainingAmount === 0 && c.status === 'ACTIVE' && <Badge className="bg-green-100 text-green-700">مسدد بالكامل</Badge>}
                    </div>
                    <p className="text-sm">{c.warehouse?.name} - {c.client?.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(c.startDate).toLocaleDateString('ar-IQ')} → {new Date(c.endDate).toLocaleDateString('ar-IQ')}
                      {' | '}{Number(c.rentAmount).toLocaleString()} دينار
                      {c.paidAmount > 0 && <span className="text-green-600 mr-2">| مدفوع: {Number(c.paidAmount).toLocaleString()}</span>}
                      {c.remainingAmount > 0 && <span className="text-red-500 mr-2">| متبقي: {Number(c.remainingAmount).toLocaleString()}</span>}
                      {c.discount > 0 && <span className="text-red-500 mr-2">-{Number(c.discount).toLocaleString()}</span>}
                    </p>
                    {filterTab === 'incomplete' && (
                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-1">
                        <div className="bg-gradient-to-l from-green-500 to-yellow-400 h-2 rounded-full transition-all" style={{ width: `${payPct}%` }}></div>
                      </div>
                    )}
                    {c.isPreAgreed && <Badge className="bg-orange-100 text-orange-700 text-xs">متفق عليه سابقاً</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <WhatsAppButton
                      phone={c.clientPhone || c.client?.phone || ''}
                      name={c.client?.fullName || ''}
                      defaultCategory="contracts"
                      presetFields={{ amount: String(c.rentAmount || ''), contractNo: c.contractNo, warehouse: c.warehouse?.name || '', date: new Date(c.endDate).toLocaleDateString('ar-IQ') }}
                    />
                    {c.status === 'ACTIVE' && (
                      <Button variant="destructive" size="sm" onClick={(e) => handleTerminate(c.id, e)}>إنهاء</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد عقود</p>}
      </div>
    </div>
  )
}
