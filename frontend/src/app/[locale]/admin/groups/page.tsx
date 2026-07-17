'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Building2, Users, ChevronDown, ChevronUp, AlertTriangle, DollarSign, Warehouse, ExternalLink, Search, SortAsc } from 'lucide-react'

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

export default function AdminGroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', investorName: '', description: '' })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'occupancy' | 'revenue'>('name')

  const load = () => api.groups.list().then(setGroups).catch(console.error)
  useEffect(() => { load() }, [])

  const resetForm = () => { setForm({ name: '', investorName: '', description: '' }); setEditingId(null) }

  const handleSubmit = async () => {
    try {
      if (editingId) { await api.groups.update(editingId, form) } else { await api.groups.create(form) }
      resetForm(); setShowForm(false); load()
    } catch (err: any) { alert(err.message) }
  }

  const handleEdit = (g: any) => {
    setForm({ name: g.name, investorName: g.investorName, description: g.description || '' })
    setEditingId(g.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return
    try { await api.groups.delete(id); load() }
    catch (err: any) { alert(err.message) }
  }

  const filtered = groups
    .filter(g => !search || g.name.includes(search) || g.investorName.includes(search))
    .sort((a, b) => {
      if (sortBy === 'occupancy') return b.occupancyRate - a.occupancyRate
      if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue
      return a.name.localeCompare(b.name, 'ar')
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">المجموعات</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة مجموعة
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>اسم المجموعة</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>المستثمر</Label><Input value={form.investorName} onChange={e => setForm({ ...form, investorName: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>الوصف</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? 'تحديث' : 'إضافة'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ابحث باسم المجموعة أو المستثمر..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="border rounded-lg p-2 text-sm"
        >
          <option value="name">الترتيب: الاسم</option>
          <option value="occupancy">الترتيب: نسبة الإشغال</option>
          <option value="revenue">الترتيب: الإيرادات</option>
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.map(g => {
          const isExpanded = expandedId === g.id
          const barColor = g.occupancyRate >= 80 ? 'bg-green-500' : g.occupancyRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'

          return (
            <Card key={g.id}>
              <CardContent className="p-0">
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <p className="font-semibold">{g.name}</p>
                        {g.expiringCount > 0 && (
                          <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {g.expiringCount} وشيك
                          </Badge>
                        )}
                        {g.expiredCount > 0 && (
                          <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {g.expiredCount} منتهي
                          </Badge>
                        )}
                        {g.occupancyRate >= 100 && (
                          <Badge className="bg-blue-100 text-blue-700">ممتلئ</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {g.investorName}</span>
                        <span className="flex items-center gap-1"><Warehouse className="w-3 h-3" /> {g.rentedWarehouses}/{g.totalWarehouses} مؤجر</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {g.totalRevenue.toLocaleString()} د.ع</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mr-3">
                      <Button variant="ghost" className="p-3" onClick={(e) => { e.stopPropagation(); handleEdit(g) }}><Edit2 className="w-5 h-5" /></Button>
                      <Button variant="ghost" className="p-3 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(g.id) }}><Trash2 className="w-5 h-5" /></Button>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>نسبة الإشغال: {g.occupancyRate}%</span>
                      <span>{g.rentedWarehouses} من {g.totalWarehouses} مخازن</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${g.occupancyRate}%` }} />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-2">
                    {g.warehouses && g.warehouses.length > 0 ? (
                      g.warehouses.map((w: any) => (
                        <div key={w.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">{w.code}</span>
                            <Badge className={statusColor[w.status]}>{statusText[w.status]}</Badge>
                            {w.activeContract && (
                              <span className="text-sm text-gray-600">
                                {w.activeContract.tenant?.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {w.activeContract && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 text-xs flex items-center gap-1"
                                onClick={() => router.push(`/admin/contracts/${w.activeContract.id}`)}
                              >
                                <ExternalLink className="w-3 h-3" /> العقد
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm py-2 text-center">لا توجد مخازن في هذه المجموعة</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 flex items-center gap-2"
                      onClick={() => router.push(`/admin/warehouses?groupId=${g.id}`)}
                    >
                      <Plus className="w-4 h-4" /> إضافة مخزن إلى {g.name}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد مجموعات</p>}
      </div>
    </div>
  )
}
