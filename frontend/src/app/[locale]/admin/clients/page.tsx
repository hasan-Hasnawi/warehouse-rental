'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Phone, Mail, Calendar, Plus, Edit2, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight, FileDown } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' })
  const router = useRouter()

  const load = () => api.admin.listUsers('CLIENT').then(setClients).catch(console.error)
  useEffect(() => { load() }, [])

  const resetForm = () => { setForm({ email: '', password: '', fullName: '', phone: '' }); setEditingId(null); setShowPassword(false) }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        const data: any = { fullName: form.fullName, phone: form.phone }
        if (form.email) data.email = form.email
        if (form.password) data.password = form.password
        await api.admin.updateUser(editingId, data)
      } else {
        await api.admin.createUser({ ...form, role: 'CLIENT' })
      }
      resetForm(); setShowForm(false); load()
    } catch (err: any) { alert(err.message) }
  }

  const handleEdit = (c: any) => {
    setForm({ fullName: c.fullName, email: c.email, phone: c.phone || '', password: '' })
    setEditingId(c.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستأجر؟')) return
    try { await api.admin.deleteUser(id); load() }
    catch (err: any) { alert(err.message) }
  }

  const toggleActive = async (c: any) => {
    try { await api.admin.updateUser(c.id, { isActive: !c.isActive }); load() }
    catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المستأجرون</h1>
          <p className="text-gray-500">إجمالي المستأجرين: {clients.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(clients, [{ header:'الاسم',key:'fullName' },{ header:'البريد',key:'email' },{ header:'الهاتف',key:'phone' },{ header:'تاريخ التسجيل',key:'createdAt',render:(v)=>new Date(v).toLocaleDateString('ar-IQ') },{ header:'الحالة',key:'isActive',render:(v)=>v?'نشط':'غير نشط' }], 'المستأجرون')}><FileDown className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('المستأجرون', clients, [{ header:'الاسم',key:'fullName' },{ header:'البريد',key:'email' },{ header:'الهاتف',key:'phone' },{ header:'الحالة',key:'isActive',render:(v)=>v?'نشط':'غير نشط' }], 'المستأجرون')}><FileDown className="w-4 h-4" /> PDF</Button>
          <Button onClick={() => { resetForm(); setShowForm(!showForm) }} className="flex items-center gap-2"><Plus className="w-4 h-4" /> {editingId ? 'إضافة جديد' : 'إضافة مستأجر'}</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'تعديل المستأجر' : 'إضافة مستأجر جديد'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>الاسم</Label><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
              <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>{editingId ? 'كلمة المرور (اتركه فارغاً إن لم ترد التغيير)' : 'كلمة المرور'}</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-2 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? 'تحديث' : 'إضافة'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {clients.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{c.fullName}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.createdAt).toLocaleDateString('ar-IQ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <WhatsAppButton phone={c.phone} name={c.fullName} />
                <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'نشط' : 'غير نشط'}</Badge>
                <button onClick={() => toggleActive(c)} className="p-1 hover:bg-gray-100 rounded" title={c.isActive ? 'تعطيل' : 'تفعيل'}>
                  {c.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                </button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(c) }}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {clients.length === 0 && <p className="text-gray-500 text-center py-8">لا يوجد مستأجرون</p>}
      </div>
    </div>
  )
}
