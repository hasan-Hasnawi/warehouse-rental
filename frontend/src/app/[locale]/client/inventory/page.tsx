'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Edit2, Search, FileDown, X, Save, MinusCircle, Layers, Building2, ChevronLeft, ArrowLeftRight, Check, MapPin } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'

type ViewMode = 'material' | 'warehouse'

function WhUsage({ used, capacity }: { used: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((used / capacity) * 100)) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`whitespace-nowrap font-medium ${pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-yellow-600' : 'text-gray-500'}`}>
        {used}/{capacity} ({pct}%)
      </span>
    </div>
  )
}

function WhOption({ wh, used, capacity, selected }: { wh: any; used: number; capacity: number; selected?: boolean }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((used / capacity) * 100)) : 0
  const isFull = pct >= 90
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 ${selected ? 'bg-yellow-50' : ''} ${isFull ? 'opacity-80' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Building2 className={`w-3.5 h-3.5 shrink-0 ${isFull ? 'text-red-500' : 'text-yellow-600'}`} />
          <span className="font-medium text-sm truncate">{wh.name}</span>
          {isFull && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full shrink-0">ممتلئ</span>}
        </div>
        {wh.address && <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 shrink-0" />{wh.address}</p>}
        <div className="mt-1"><WhUsage used={used} capacity={capacity} /></div>
      </div>
      {selected && <Check className="w-4 h-4 text-yellow-700 shrink-0" />}
    </div>
  )
}

function WhDropdown({ value, onChange, warehouses, items, includeEmpty, emptyLabel }: {
  value: string; onChange: (v: string) => void; warehouses: any[]; items: any[];
  includeEmpty?: boolean; emptyLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = warehouses.find(w => w.id === value)
  const usedMap: Record<string, number> = {}
  items.forEach(i => {
    if (i.warehouseId) usedMap[i.warehouseId] = (usedMap[i.warehouseId] || 0) + i.quantity
  })

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex h-auto min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-right">
        <div className="flex-1 min-w-0">
          {selected ? (
            <WhOption wh={selected} used={usedMap[selected.id] || 0} capacity={selected.area || 1} />
          ) : (
            <span className="text-gray-400">{emptyLabel || 'اختر المخزن'}</span>
          )}
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-1 right-0 left-0 bg-white border rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {includeEmpty && (
              <button type="button" onClick={() => { onChange(''); setOpen(false) }}
                className="w-full text-right px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 border-b">
                {emptyLabel || 'بدون مخزن'}
              </button>
            )}
            {warehouses.map(w => {
              const used = usedMap[w.id] || 0
              const cap = w.area || 1
              return (
                <button key={w.id} type="button" onClick={() => { onChange(w.id); setOpen(false) }}
                  className={`w-full text-right border-b last:border-0 hover:bg-yellow-50 transition-colors ${w.id === value ? 'bg-yellow-50' : ''}`}>
                  <WhOption wh={w} used={used} capacity={cap} selected={w.id === value} />
                </button>
              )
            })}
            {warehouses.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">لا توجد مخازن</p>}
          </div>
        </>
      )}
    </div>
  )
}

export default function ClientInventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('material')
  const [selectedWh, setSelectedWh] = useState('')
  const [newItem, setNewItem] = useState({ itemName: '', subName: '', quantity: 1, description: '', warehouseId: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ itemName: '', subName: '', quantity: 1, description: '', warehouseId: '' })
  const [withdrawItem, setWithdrawItem] = useState<any>(null)
  const [withdrawQty, setWithdrawQty] = useState(1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showSubSuggestions, setShowSubSuggestions] = useState(false)
  const [transferItem, setTransferItem] = useState<any>(null)
  const [transferQty, setTransferQty] = useState(1)
  const [transferTo, setTransferTo] = useState('')

  const LOW_QTY = 5

  const load = () => {
    setLoading(true)
    Promise.all([
      api.inventory.list().then(setItems),
      api.contracts.list('status=ACTIVE').then(contracts => setWarehouses(contracts.map((c: any) => c.warehouse).filter(Boolean))),
    ]).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const resetForm = () => setNewItem({ itemName: '', subName: '', quantity: 1, description: '', warehouseId: '' })

  const addItem = async () => {
    if (!newItem.itemName) return
    try {
      await api.inventory.create({
        itemName: newItem.itemName,
        subName: newItem.subName || undefined,
        quantity: newItem.quantity,
        description: newItem.description || undefined,
        warehouseId: newItem.warehouseId || undefined,
      })
      resetForm(); load()
    } catch (err: any) { alert(err.message) }
  }

  const removeItem = async (id: string) => {
    if (!confirm('حذف هذا الصنف؟')) return
    try { await api.inventory.delete(id); load() }
    catch (err: any) { alert(err.message) }
  }

  const startEdit = (item: any) => {
    setEditingId(item.id)
    setEditForm({
      itemName: item.itemName,
      subName: item.subName || '',
      quantity: item.quantity,
      description: item.description || '',
      warehouseId: item.warehouseId || '',
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await api.inventory.update(editingId, {
        itemName: editForm.itemName,
        subName: editForm.subName || null,
        quantity: editForm.quantity,
        description: editForm.description || null,
        warehouseId: editForm.warehouseId || null,
      })
      setEditingId(null); load()
    } catch (err: any) { alert(err.message) }
  }

  const handleWithdraw = async () => {
    if (!withdrawItem || withdrawQty < 1) return
    const newQty = withdrawItem.quantity - withdrawQty
    if (newQty < 0) { alert('الكمية المخرجة أكبر من الكمية الموجودة'); return }
    try {
      await api.inventory.update(withdrawItem.id, { quantity: newQty })
      setWithdrawItem(null); setWithdrawQty(1); load()
    } catch (err: any) { alert(err.message) }
  }

  const handleTransfer = async () => {
    if (!transferItem || transferQty < 1 || !transferTo) return
    if (transferTo === transferItem.warehouseId) { alert('اختر مخزن مختلف'); return }
    if (transferQty > transferItem.quantity) { alert('الكمية أكبر من الموجودة'); return }
    const targetItem = items.find(i => i.itemName === transferItem.itemName && i.subName === transferItem.subName && i.warehouseId === transferTo)
    try {
      await api.inventory.update(transferItem.id, { quantity: transferItem.quantity - transferQty })
      if (targetItem) {
        await api.inventory.update(targetItem.id, { quantity: targetItem.quantity + transferQty })
      } else {
        await api.inventory.create({
          itemName: transferItem.itemName,
          subName: transferItem.subName || undefined,
          quantity: transferQty,
          description: transferItem.description || undefined,
          warehouseId: transferTo,
        })
      }
      setTransferItem(null); setTransferQty(1); setTransferTo(''); load()
    } catch (err: any) { alert(err.message) }
  }

  const openWithdraw = (item: any) => {
    setWithdrawItem(item); setWithdrawQty(1)
  }

  const openTransfer = (item: any) => {
    setTransferItem(item); setTransferQty(1); setTransferTo('')
  }

  const filteredBySearch = items.filter(i => {
    const q = search.toLowerCase()
    return i.itemName.toLowerCase().includes(q) || (i.subName || '').toLowerCase().includes(q)
  })

  const warehouseFiltered = selectedWh
    ? filteredBySearch.filter(i => i.warehouseId === selectedWh)
    : filteredBySearch

  const grouped = warehouseFiltered.reduce((acc: any, item: any) => {
    const key = item.itemName
    if (!acc[key]) acc[key] = { itemName: key, items: [], totalQuantity: 0 }
    acc[key].items.push(item)
    acc[key].totalQuantity += item.quantity
    return acc
  }, {} as Record<string, { itemName: string; items: any[]; totalQuantity: number }>)

  const uniqueNames = items.reduce((acc: string[], item) => {
    if (!acc.includes(item.itemName)) acc.push(item.itemName)
    return acc
  }, [] as string[])

  const filteredSuggestions = newItem.itemName
    ? uniqueNames.filter(n => n !== newItem.itemName && n.toLowerCase().includes(newItem.itemName.toLowerCase()))
    : []

  const existingBranches = items.filter(i => i.itemName === newItem.itemName && i.id !== editingId)
  const existingBranchesTotal = existingBranches.reduce((sum: number, i: any) => sum + i.quantity, 0)

  const selectName = (name: string) => {
    setNewItem({ ...newItem, itemName: name })
    setShowSuggestions(false)
  }

  const uniqueSubNames = newItem.itemName
    ? items.filter(i => i.itemName === newItem.itemName && i.subName).reduce((acc: string[], i) => {
        if (i.subName && !acc.includes(i.subName)) acc.push(i.subName)
        return acc
      }, [] as string[])
    : []

  const filteredSubSuggestions = newItem.subName
    ? uniqueSubNames.filter(s => s !== newItem.subName && s.toLowerCase().includes(newItem.subName.toLowerCase()))
    : uniqueSubNames

  const selectSubName = (name: string) => {
    setNewItem({ ...newItem, subName: name })
    setShowSubSuggestions(false)
  }

  const otherWarehouses = transferItem
    ? warehouses.filter(w => w.id !== transferItem.warehouseId)
    : []

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المخزون</h1>
          <p className="text-gray-500">إجمالي الأصناف: {items.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(filteredBySearch, [{ header:'الصنف',key:'itemName' },{ header:'الوصف',key:'subName' },{ header:'الكمية',key:'quantity' },{ header:'المخزن',key:'warehouse',render:(_,r)=>r.warehouse?.name||'—' }], 'المخزون')}><FileDown className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('المخزون', filteredBySearch, [{ header:'الصنف',key:'itemName' },{ header:'الوصف',key:'subName' },{ header:'الكمية',key:'quantity' },{ header:'المخزن',key:'warehouse',render:(_,r)=>r.warehouse?.name||'—' }], 'المخزون')}><FileDown className="w-4 h-4" /> PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>إضافة صنف</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label>الاسم الرئيسي</Label>
              <Input value={newItem.itemName}
                onChange={e => { setNewItem({ ...newItem, itemName: e.target.value }); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="مثال: بنطرون تركي" />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-50 top-full mt-1 right-0 left-0 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.map(name => {
                    const total = items.filter(i => i.itemName === name).reduce((s: number, i: any) => s + i.quantity, 0)
                    return (
                      <li key={name} onMouseDown={() => selectName(name)}
                        className="px-4 py-2.5 cursor-pointer hover:bg-yellow-50 text-sm flex items-center justify-between transition-colors">
                        <span>{name}</span>
                        <span className="text-xs text-gray-400">{total} قطعة</span>
                      </li>
                    )
                  })}
                </ul>
              )}
              {existingBranches.length > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
                  <p className="text-xs text-yellow-700 font-semibold mb-1.5">─── الفروع الموجودة ───</p>
                  {existingBranches.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between py-1 text-xs">
                      <span>{b.subName || <span className="text-gray-400">—</span>}</span>
                      <span className="text-gray-500">{b.quantity} قطعة | {b.warehouse?.name || '—'}</span>
                    </div>
                  ))}
                  <p className="text-xs text-yellow-700 mt-1.5 font-medium">المجموع: {existingBranchesTotal} قطعة</p>
                </div>
              )}
            </div>
            <div className="space-y-2 relative">
              <Label>الاسم الثانوي (اختياري)</Label>
              <Input value={newItem.subName}
                onChange={e => { setNewItem({ ...newItem, subName: e.target.value }); setShowSubSuggestions(true) }}
                onFocus={() => newItem.itemName && setShowSubSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSubSuggestions(false), 200)}
                placeholder="مثال: لون ازرق / مقاس 40" />
              {showSubSuggestions && filteredSubSuggestions.length > 0 && (
                <ul className="absolute z-50 top-full mt-1 right-0 left-0 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredSubSuggestions.map(sub => {
                    const total = items.filter(i => i.itemName === newItem.itemName && i.subName === sub).reduce((s: number, i: any) => s + i.quantity, 0)
                    return (
                      <li key={sub} onMouseDown={() => selectSubName(sub)}
                        className="px-4 py-2.5 cursor-pointer hover:bg-yellow-50 text-sm flex items-center justify-between transition-colors">
                        <span>{sub}</span>
                        <span className="text-xs text-gray-400">{total} قطعة</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} min={1} />
            </div>
            <div className="space-y-2">
              <Label>المخزن</Label>
              <WhDropdown value={newItem.warehouseId} onChange={v => setNewItem({ ...newItem, warehouseId: v })}
                warehouses={warehouses} items={items} emptyLabel="اختر المخزن" />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Input value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="اختياري" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addItem} className="flex items-center gap-2"><Plus className="w-4 h-4" /> إضافة</Button>
            {newItem.itemName && <Button variant="ghost" onClick={resetForm}><X className="w-4 h-4" /></Button>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setViewMode('material')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'material' ? 'bg-white shadow-sm text-yellow-800' : 'text-gray-600 hover:text-gray-800'}`}>
            <Layers className="w-4 h-4" /> حسب المادة
          </button>
          <button onClick={() => setViewMode('warehouse')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'warehouse' ? 'bg-white shadow-sm text-yellow-800' : 'text-gray-600 hover:text-gray-800'}`}>
            <Building2 className="w-4 h-4" /> حسب المخزن
          </button>
        </div>
        <div className="flex gap-2 flex-1 max-w-sm mr-auto">
          {viewMode === 'warehouse' && (
            <WhDropdown value={selectedWh} onChange={setSelectedWh}
              warehouses={warehouses} items={items} includeEmpty emptyLabel="كل المخازن" />
          )}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input className="pr-9" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">جاري التحميل...</div>
      ) : viewMode === 'material' ? (
        <div className="space-y-4">
          {Object.values(grouped).map((group: any) => (
            <Card key={group.itemName}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">{group.itemName}</p>
                    <p className="text-xs text-gray-400">المجموع: {group.totalQuantity}</p>
                  </div>
                </div>
                <div className="space-y-2 mr-4 border-r-2 border-yellow-200 pr-4">
                  {group.items.map((item: any) => {
                    const isLow = item.quantity <= LOW_QTY && item.quantity > 0
                    return (
                      <div key={item.id} className={`flex items-center justify-between py-2 ${isLow ? 'bg-red-50 -mx-4 px-4 rounded-lg border border-red-100' : ''}`}>
                        <div className="flex items-center gap-2">
                          <ChevronLeft className={`w-3 h-3 ${isLow ? 'text-red-300' : 'text-gray-300'}`} />
                          <div>
                            <p className="font-medium text-sm">
                              {item.subName || <span className="text-gray-400">—</span>}
                              {isLow && <span className="mr-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">منخفض</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                              الكمية: {item.quantity}
                              {item.warehouse && <span className="mr-2">المخزن: {item.warehouse.name}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {item.quantity > 0 && <Button variant="outline" size="icon" onClick={() => openWithdraw(item)} className="text-orange-600 border-orange-200 hover:bg-orange-50"><MinusCircle className="w-4 h-4" /></Button>}
                          {item.warehouseId && warehouses.length > 1 && <Button variant="outline" size="icon" onClick={() => openTransfer(item)} className="text-blue-600 border-blue-200 hover:bg-blue-50"><ArrowLeftRight className="w-4 h-4" /></Button>}
                          <Button variant="ghost" size="icon" onClick={() => startEdit(item)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          {Object.keys(grouped).length === 0 && <p className="text-gray-500 text-center py-8">لا توجد أصناف مسجلة بعد</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {warehouses.filter(w => !selectedWh || w.id === selectedWh).map(wh => {
            const whItems = filteredBySearch.filter(i => i.warehouseId === wh.id)
            if (whItems.length === 0) return null
            const used = items.filter(i => i.warehouseId === wh.id).reduce((s, i) => s + i.quantity, 0)
            const cap = wh.area || 1
            const isFull = cap > 0 && (used / cap) >= 0.9
            return (
              <Card key={wh.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className={`font-bold text-lg flex items-center gap-2 ${isFull ? 'text-red-700' : ''}`}>
                        <Building2 className={`w-4 h-4 ${isFull ? 'text-red-500' : 'text-yellow-600'}`} /> {wh.name}
                      </p>
                      {wh.address && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{wh.address}</p>}
                      <div className="mt-1.5"><WhUsage used={used} capacity={cap} /></div>
                    </div>
                    {isFull && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">المخزن ممتلئ</span>}
                  </div>
                  <div className="space-y-1">
                    {whItems.map((item: any) => {
                      const isLow = item.quantity <= LOW_QTY && item.quantity > 0
                      return (
                        <div key={item.id} className={`flex items-center justify-between py-1.5 ${isLow ? 'bg-red-50 -mx-4 px-4 rounded-lg border border-red-100' : ''}`}>
                          <p className="text-sm">
                            {item.itemName}
                            {item.subName && <span className="text-gray-400 mr-1">/ {item.subName}</span>}
                            <span className="mr-2 text-gray-500">— {item.quantity}</span>
                            {isLow && <span className="mr-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">منخفض</span>}
                          </p>
                          <div className="flex gap-1">
                            {item.quantity > 0 && <Button variant="outline" size="icon" onClick={() => openWithdraw(item)} className="text-orange-600 border-orange-200 hover:bg-orange-50"><MinusCircle className="w-4 h-4" /></Button>}
                            {item.warehouseId && warehouses.length > 1 && <Button variant="outline" size="icon" onClick={() => openTransfer(item)} className="text-blue-600 border-blue-200 hover:bg-blue-50"><ArrowLeftRight className="w-4 h-4" /></Button>}
                            <Button variant="ghost" size="icon" onClick={() => startEdit(item)}><Edit2 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {warehouses.filter(w => !selectedWh || w.id === selectedWh).every(wh => filteredBySearch.filter(i => i.warehouseId === wh.id).length === 0) &&
            <p className="text-gray-500 text-center py-8">لا توجد أصناف مسجلة بعد</p>}
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">تعديل الصنف</h3>
              <button onClick={() => setEditingId(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">الاسم الرئيسي</Label><Input value={editForm.itemName} onChange={e => setEditForm({ ...editForm, itemName: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">الاسم الثانوي</Label><Input value={editForm.subName} onChange={e => setEditForm({ ...editForm, subName: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">الكمية</Label><Input type="number" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })} /></div>
                <div className="space-y-1"><Label className="text-xs">المخزن</Label>
                  <WhDropdown value={editForm.warehouseId} onChange={v => setEditForm({ ...editForm, warehouseId: v })}
                    warehouses={warehouses} items={items} includeEmpty emptyLabel="بدون مخزن" />
                </div>
                <div className="space-y-1"><Label className="text-xs">ملاحظات</Label><Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} className="flex items-center gap-1"><Save className="w-4 h-4" /> حفظ</Button>
                <Button variant="outline" onClick={() => setEditingId(null)}>إلغاء</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {withdrawItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setWithdrawItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><MinusCircle className="w-5 h-5 text-orange-600" /> اخراج من المخزون</h3>
              <button onClick={() => setWithdrawItem(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="font-semibold">{withdrawItem.itemName}{withdrawItem.subName ? ` / ${withdrawItem.subName}` : ''}</p>
                <p className="text-sm text-gray-500">الكمية الحالية: {withdrawItem.quantity} | المخزن: {withdrawItem.warehouse?.name || '—'}</p>
              </div>
              <div className="space-y-2">
                <Label>الكمية المخرجة</Label>
                <Input type="number" value={withdrawQty} onChange={e => setWithdrawQty(parseInt(e.target.value) || 1)} min={1} max={withdrawItem.quantity} />
                <p className="text-sm text-gray-400">← تبقى: <span className="font-semibold">{Math.max(0, withdrawItem.quantity - withdrawQty)}</span></p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleWithdraw} className="flex-1 bg-orange-600 hover:bg-orange-700 flex items-center gap-2"><MinusCircle className="w-4 h-4" /> تأكيد الاخراج</Button>
                <Button variant="outline" onClick={() => setWithdrawItem(null)}>إلغاء</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {transferItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTransferItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-blue-600" /> نقل بين المخازن</h3>
              <button onClick={() => setTransferItem(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="font-semibold">{transferItem.itemName}{transferItem.subName ? ` / ${transferItem.subName}` : ''}</p>
                <p className="text-sm text-gray-500">الكمية الحالية: {transferItem.quantity} | المخزن الحالي: {transferItem.warehouse?.name || '—'}</p>
              </div>
              <div className="space-y-2">
                <Label>الكمية المنقولة</Label>
                <Input type="number" value={transferQty} onChange={e => setTransferQty(parseInt(e.target.value) || 1)} min={1} max={transferItem.quantity} />
              </div>
              <div className="space-y-2">
                <Label>المخزن الوجهة</Label>
                <WhDropdown value={transferTo} onChange={setTransferTo}
                  warehouses={otherWarehouses} items={items} emptyLabel="اختر المخزن الوجهة" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTransfer} disabled={!transferTo || transferQty < 1}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> تأكيد النقل</Button>
                <Button variant="outline" onClick={() => setTransferItem(null)}>إلغاء</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
