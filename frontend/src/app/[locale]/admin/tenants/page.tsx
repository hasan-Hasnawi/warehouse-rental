'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Phone, FileText, Calendar } from 'lucide-react'

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phone2, setPhone2] = useState('')
  const router = useRouter()

  const load = () => { api.tenants.list().then(setTenants).catch(console.error) }
  useEffect(() => { load() }, [])

  const filtered = tenants.filter(t => !search || t.name.includes(search) || t.phone?.includes(search))

  const handleCreate = async () => {
    if (!name) { alert('يرجى إدخال اسم المستأجر'); return }
    try {
      await api.tenants.create({ name, phone: phone || undefined, phone2: phone2 || undefined })
      setName(''); setPhone(''); setPhone2(''); setShowForm(false); load()
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">المستأجرون</h1>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة مستأجر
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
        <Input className="pr-10" placeholder="بحث بالاسم أو رقم الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="الاسم *" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="رقم الهاتف 1" value={phone} onChange={e => setPhone(e.target.value)} />
              <Input placeholder="رقم الهاتف 2" value={phone2} onChange={e => setPhone2(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>إضافة</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(t => (
          <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/admin/tenants/${t.id}`)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold">{t.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {t.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {t.phone}</span>}
                  {t.phone2 && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {t.phone2}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(t.createdAt).toLocaleDateString('ar-IQ')}</span>
                </div>
              </div>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <FileText className="w-4 h-4" /> {t._count?.contracts || 0} عقود
              </span>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-500 py-8">لا يوجد مستأجرون</p>}
      </div>
    </div>
  )
}
