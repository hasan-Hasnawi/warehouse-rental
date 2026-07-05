'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FileDown, Search, Package, Trash2, Edit2 } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'

export default function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { api.inventory.list().then(setItems).catch(console.error) }, [])

  const filtered = items.filter(i =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    i.client?.fullName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا الصنف؟')) return
    try { await api.inventory.delete(id); setItems(items.filter(i => i.id !== id)) }
    catch (err: any) { alert(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المخزون (كل المستأجرين)</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(filtered, [{ header:'الصنف',key:'itemName' },{ header:'الكمية',key:'quantity' },{ header:'المستأجر',key:'client',render:(_,r)=>r.client?.fullName },{ header:'المخزن',key:'warehouse',render:(_,r)=>r.warehouse?.name||'—' },{ header:'ملاحظات',key:'description' }], 'المخزون')}><FileDown className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('المخزون', filtered, [{ header:'الصنف',key:'itemName' },{ header:'الكمية',key:'quantity' },{ header:'المستأجر',key:'client',render:(_,r)=>r.client?.fullName },{ header:'المخزن',key:'warehouse',render:(_,r)=>r.warehouse?.name||'—' }], 'المخزون')}><FileDown className="w-4 h-4" /> PDF</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input className="pr-9" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {filtered.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold">{item.itemName}</p>
                  <p className="text-sm text-gray-500">
                    الكمية: {item.quantity}
                    {item.warehouse && <span className="mr-3">المخزن: {item.warehouse.name}</span>}
                    {item.description && <span className="mr-3">— {item.description}</span>}
                  </p>
                  <p className="text-xs text-gray-400">{item.client?.fullName}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد أصناف</p>}
      </div>
    </div>
  )
}
