'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, Phone, Mail, User, Edit2, Trash2, ToggleLeft, ToggleRight, FileDown } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function AdminGuardsPage() {
  const [guards, setGuards] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ username: '', password: '', fullName: '', phone: '' })
  const router = useRouter()

  const load = () => api.admin.listUsers('GUARD').then(setGuards).catch(console.error)
  useEffect(() => { load() }, [])

  const resetForm = () => { setForm({ username: '', password: '', fullName: '', phone: '' }); setEditingId(null) }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        const { password, ...data } = form
        await api.admin.updateUser(editingId, password ? { ...data, password } : data)
      } else {
        await api.admin.createUser({ ...form, role: 'GUARD' })
      }
      resetForm(); setShowForm(false); load()
    } catch (err: any) { alert(err.message) }
  }

  const handleEdit = (g: any) => {
    setForm({ fullName: g.fullName, username: g.username || '', phone: g.phone || '', password: '' })
    setEditingId(g.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحارس؟')) return
    try { await api.admin.deleteUser(id); load() }
    catch (err: any) { alert(err.message) }
  }

  const toggleActive = async (g: any) => {
    try {
      await api.admin.updateUser(g.id, { isActive: !g.isActive })
      load()
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الحراس</h1>
          <p className="text-gray-500">إجمالي الحراس: {guards.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(guards, [{ header:'الاسم',key:'fullName' },{ header:'اسم المستخدم',key:'username' },{ header:'الهاتف',key:'phone' },{ header:'الحالة',key:'isActive',render:(v)=>v?'نشط':'غير نشط' }], 'الحراس')}><FileDown className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('الحراس', guards, [{ header:'الاسم',key:'fullName' },{ header:'اسم المستخدم',key:'username' },{ header:'الهاتف',key:'phone' },{ header:'الحالة',key:'isActive',render:(v)=>v?'نشط':'غير نشط' }], 'الحراس')}><FileDown className="w-4 h-4" /> PDF</Button>
          <Button onClick={() => { resetForm(); setShowForm(!showForm) }} className="flex items-center gap-2"><Plus className="w-4 h-4" /> {editingId ? 'إضافة جديد' : 'إضافة حارس'}</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'تعديل الحارس' : 'إضافة حارس جديد'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>الاسم</Label><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
              <div className="space-y-2"><Label>اسم المستخدم</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>{editingId ? 'كلمة المرور (اتركه فارغاً إن لم ترد التغيير)' : 'كلمة المرور'}</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? 'تحديث' : 'إضافة'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {guards.map(g => (
          <Card key={g.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/admin/guards/${g.id}`)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold">{g.fullName}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{g.username || g.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{g.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <WhatsAppButton phone={g.phone} name={g.fullName} defaultCategory="guards" />
                <Badge variant={g.isActive ? 'default' : 'secondary'}>{g.isActive ? 'نشط' : 'غير نشط'}</Badge>
                <button onClick={() => toggleActive(g)} className="p-1 hover:bg-gray-100 rounded" title={g.isActive ? 'تعطيل' : 'تفعيل'}>
                  {g.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                </button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(g)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {guards.length === 0 && <p className="text-gray-500 text-center py-8">لا يوجد حراس</p>}
      </div>
    </div>
  )
}
