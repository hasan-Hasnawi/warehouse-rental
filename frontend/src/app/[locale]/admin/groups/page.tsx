'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Trash2, Building2, Users } from 'lucide-react'

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', investorName: '', description: '' })

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المجموعات</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة مجموعة
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
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

      <div className="grid gap-3">
        {groups.map(g => (
          <Card key={g.id}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <p className="font-semibold">{g.name}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{g.investorName}</span>
                  {g._count && <span>{g._count.warehouses} مخازن</span>}
                </div>
                {g.description && <p className="text-xs text-gray-400">{g.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(g)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {groups.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد مجموعات</p>}
      </div>
    </div>
  )
}
