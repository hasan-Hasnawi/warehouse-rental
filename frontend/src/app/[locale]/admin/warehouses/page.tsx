'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, MapPin, Maximize2, DollarSign, Shield, Layers, Filter, FileDown } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'

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

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [guards, setGuards] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterGuard, setFilterGuard] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterAreaMin, setFilterAreaMin] = useState('')
  const [filterAreaMax, setFilterAreaMax] = useState('')
  const [form, setForm] = useState({ name: '', code: '', area: '', address: '', city: '', pricePer6Months: '', description: '', guardId: '', groupId: '', status: '' })

  const buildParams = () => {
    const p = new URLSearchParams()
    if (filterGuard) p.set('guardId', filterGuard)
    if (filterGroup) p.set('groupId', filterGroup)
    if (filterAreaMin) p.set('areaMin', filterAreaMin)
    if (filterAreaMax) p.set('areaMax', filterAreaMax)
    return p.toString()
  }

  const load = () => {
    api.warehouses.list(buildParams()).then(setWarehouses).catch(console.error)
    api.groups.list().then(setGroups).catch(console.error)
    api.admin.listUsers('GUARD').then(setGuards).catch(console.error)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      api.warehouses.list(buildParams()).then(setWarehouses).catch(console.error)
    }, 300)
    return () => clearTimeout(timer)
  }, [filterGuard, filterGroup, filterAreaMin, filterAreaMax])

  const resetForm = () => { setForm({ name: '', code: '', area: '', address: '', city: '', pricePer6Months: '', description: '', guardId: '', groupId: '', status: '' }); setEditingId(null) }

  const handleSubmit = async () => {
    const p = parseFloat(form.pricePer6Months)
    const data = {
      ...form,
      area: parseFloat(form.area),
      pricePer6Months: p,
      pricePerMonth: Math.round(p / 6),
      guardId: form.guardId || undefined,
      groupId: form.groupId || undefined,
    }
    try {
      if (editingId) { await api.warehouses.update(editingId, data) } else { await api.warehouses.create(data) }
      resetForm(); setShowForm(false); load()
    } catch (err: any) { alert(err.message) }
  }

  const handleEdit = (w: any) => {
    setForm({
      name: w.name, code: w.code, area: w.area.toString(), address: w.address, city: w.city,
      pricePer6Months: w.pricePer6Months?.toString() || (w.pricePerMonth * 6).toString(),
      description: w.description || '', guardId: w.guardId || '', groupId: w.groupId || '', status: w.status || '',
    })
    setEditingId(w.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المخزن؟')) return
    try { await api.warehouses.delete(id); load() }
    catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المخازن</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(warehouses, [{ header:'الاسم',key:'name' },{ header:'الكود',key:'code' },{ header:'المساحة',key:'area' },{ header:'المدينة',key:'city' },{ header:'السعر/6شهور',key:'pricePer6Months',render:(_,r)=>Number(r.pricePer6Months||r.pricePerMonth*6).toLocaleString() },{ header:'الحالة',key:'status',render:(v)=>statusText[v]||v },{ header:'الحارس',key:'guard',render:(_,r)=>r.guard?.fullName },{ header:'المجموعة',key:'group',render:(_,r)=>r.group?.name }], 'المخازن')}><FileDown className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('المخازن', warehouses, [{ header:'الاسم',key:'name' },{ header:'الكود',key:'code' },{ header:'المساحة',key:'area' },{ header:'المدينة',key:'city' },{ header:'الحالة',key:'status',render:(v)=>statusText[v]||v }], 'المخازن')}><FileDown className="w-4 h-4" /> PDF</Button>
          <Button onClick={() => { resetForm(); setShowForm(!showForm) }} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة مخزن
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium">تصفية</span></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">الحارس</Label>
              <Select value={filterGuard} onChange={e => setFilterGuard(e.target.value)}>
                  <option value="">الكل</option>
                  {guards.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
                </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">المجموعة</Label>
              <Select value={filterGroup} onChange={e => setFilterGroup(e.target.value === '__all' ? '' : e.target.value)}>
                  <option value="__all">الكل</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">المساحة من</Label>
              <Input type="number" placeholder="0" value={filterAreaMin} onChange={e => setFilterAreaMin(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">المساحة إلى</Label>
              <Input type="number" placeholder="10000" value={filterAreaMax} onChange={e => setFilterAreaMax(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>اسم المخزن</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>الكود</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="space-y-2"><Label>المساحة (م²)</Label><Input type="number" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></div>
              <div className="space-y-2"><Label>السعر لكل 6 أشهر</Label><Input type="number" value={form.pricePer6Months} onChange={e => setForm({ ...form, pricePer6Months: e.target.value })} /></div>
              <div className="space-y-2"><Label>المدينة</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>المجموعة</Label>
                <Select value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
                  <option value="">اختر المجموعة</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحارس</Label>
                <Select value={form.guardId} onChange={e => setForm({ ...form, guardId: e.target.value })}>
                  <option value="">اختر الحارس</option>
                  {guards.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
                </Select>
              </div>
              {editingId && (
                <div className="space-y-2">
                  <Label>حالة المخزن</Label>
                  <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="">اختر الحالة</option>
                    <option value="VACANT">شاغر</option>
                    <option value="RENTED">مؤجر</option>
                    <option value="MAINTENANCE">تحت الصيانة</option>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2"><Label>الوصف</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? 'تحديث' : 'إضافة'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {warehouses.map(w => (
          <Card key={w.id}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{w.name}</p>
                  <Badge className={statusColor[w.status]}>{statusText[w.status]}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{w.city}</span>
                  <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{w.area} م²</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{Number(w.pricePer6Months || w.pricePerMonth * 6).toLocaleString()} / 6 أشهر</span>
                  {w.guard && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{w.guard.fullName}</span>}
                  {w.group && <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{w.group.name}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(w)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {warehouses.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد مخازن</p>}
      </div>
    </div>
  )
}
