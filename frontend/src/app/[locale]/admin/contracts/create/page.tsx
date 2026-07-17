'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Layers, DollarSign, CalendarDays, UserCheck, Search, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function CreateContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [warehouseCode, setWarehouseCode] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null)
  const [warehouseSearching, setWarehouseSearching] = useState(false)
  const [warehouseNotFound, setWarehouseNotFound] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [durationMonths, setDurationMonths] = useState('6')
  const [discount, setDiscount] = useState('0')
  const [guardFeeMonthly, setGuardFeeMonthly] = useState('0')
  const [isPreAgreed, setIsPreAgreed] = useState(false)
  const [notes, setNotes] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [tenantPhone2, setTenantPhone2] = useState('')
  const [storedMaterials, setStoredMaterials] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [loading, setLoading] = useState(false)
  const [renewLoading, setRenewLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<any>(null)
  const whDebounceRef = useRef<any>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renewId = searchParams.get('renew')
    if (renewId) {
      setRenewLoading(true)
      api.contracts.getById(renewId).then(old => {
        setTenantName(old.tenant?.name || '')
        setWarehouseId(old.warehouseId)
        setDiscount(String(old.discount || 0))
        setGuardFeeMonthly(String(old.guardFeeMonthly || 0))
        setIsPreAgreed(true)
        setNotes(old.notes || '')
        setTenantPhone(old.tenantPhone || '')
        setTenantPhone2(old.tenantPhone2 || '')
        setStoredMaterials(old.storedMaterials || '')
        setDurationMonths('6')
      }).catch(console.error).finally(() => setRenewLoading(false))
    }
  }, [searchParams])

  useEffect(() => {
    api.groups.list().then(setGroups).catch(console.error)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedGroup && warehouseCode.trim()) {
      if (whDebounceRef.current) clearTimeout(whDebounceRef.current)
      setWarehouseSearching(true)
      setWarehouseNotFound(false)
      setSelectedWarehouse(null)
      whDebounceRef.current = setTimeout(async () => {
        try {
          const result = await api.warehouses.searchByGroup(selectedGroup, warehouseCode.trim())
          if (result) {
            setSelectedWarehouse(result)
            setWarehouseId(result.id)
            setWarehouseNotFound(false)
          } else {
            setSelectedWarehouse(null)
            setWarehouseId('')
            setWarehouseNotFound(true)
          }
        } catch {
          setSelectedWarehouse(null)
          setWarehouseId('')
          setWarehouseNotFound(true)
        }
        finally { setWarehouseSearching(false) }
      }, 400)
    } else {
      setSelectedWarehouse(null)
      setWarehouseId('')
      setWarehouseNotFound(false)
    }
  }, [selectedGroup, warehouseCode])

  const handleSearch = (q: string) => {
    setTenantName(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setSearchResults([]); setShowResults(false); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await api.tenants.search(q)
        setSearchResults(results)
        setShowResults(results.length > 0)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
  }

  const selectTenant = (t: any) => {
    setTenantName(t.name)
    setTenantPhone(t.phone || '')
    setTenantPhone2(t.phone2 || '')
    setShowResults(false)
  }

  const computeEndDate = () => {
    if (!startDate || !durationMonths) return ''
    const d = new Date(startDate)
    d.setMonth(d.getMonth() + parseInt(durationMonths))
    return d.toISOString().split('T')[0]
  }

  const computeRentAmount = () => {
    if (!selectedWarehouse) return 0
    const p = selectedWarehouse.pricePer6Months || selectedWarehouse.pricePerMonth * 6
    const months = parseInt(durationMonths) || 6
    const periodRent = (p / 6) * months
    const disc = parseFloat(discount) || 0
    return Math.max(0, periodRent - disc)
  }

  const handleSubmit = async () => {
    if (!tenantName || !warehouseId || !startDate) {
      alert('يرجى تعبئة جميع الحقول المطلوبة')
      return
    }
    const months = parseInt(durationMonths)
    if (!isPreAgreed && months < 6) { alert('أقل مدة للعقد هي 6 أشهر'); return }
    const endDate = computeEndDate()
    const rentAmount = computeRentAmount()
    setLoading(true)
    try {
      await api.contracts.create({
        tenantName, warehouseId, startDate, endDate,
        rentAmount,
        discount: parseFloat(discount) || 0,
        guardFeeMonthly: parseFloat(guardFeeMonthly) || 0,
        isPreAgreed,
        tenantPhone: tenantPhone || undefined,
        tenantPhone2: tenantPhone2 || undefined,
        storedMaterials: storedMaterials || undefined,
        notes,
      })
      router.push('/admin/contracts')
    } catch (err: any) { alert(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{searchParams.get('renew') ? 'تجديد عقد' : 'إنشاء عقد جديد'}</h1>
        <p className="text-gray-500">{searchParams.get('renew') ? 'تم تعبئة بيانات العقد السابق، يرجى تعديل التواريخ' : 'أدخل تفاصيل العقد الجديد'}</p>
        {renewLoading && <p className="text-blue-600 text-sm mt-1">جاري تحميل بيانات العقد السابق...</p>}
      </div>

      <Card>
        <CardHeader><CardTitle>معلومات العقد</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 relative" ref={wrapperRef}>
              <Label>المستأجر *</Label>
              <div className="relative">
                <Input
                  placeholder="ابحث باسم المستأجر..."
                  value={tenantName}
                  onChange={e => handleSearch(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowResults(true) }}
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                {searching && <span className="absolute left-8 top-2.5 text-xs text-gray-400">جاري البحث...</span>}
              </div>
              {showResults && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {searchResults.map(t => (
                    <button key={t.id} type="button" className="w-full text-right px-4 py-2 hover:bg-yellow-50 text-sm" onClick={() => selectTenant(t)}>
                      <span className="font-medium">{t.name}</span>
                      {t.phone && <span className="text-gray-500 mr-2">{t.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>المجموعة *</Label>
              <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setWarehouseCode('') }} className="w-full border rounded-lg p-2 text-sm">
                <option value="">اختر المجموعة</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>رقم المخزن *</Label>
            <div className="relative">
              <Input
                placeholder="أدخل رقم المخزن..."
                value={warehouseCode}
                onChange={e => setWarehouseCode(e.target.value)}
                disabled={!selectedGroup}
                className={warehouseNotFound ? 'border-red-500' : ''}
              />
              {warehouseSearching && <span className="absolute left-3 top-2.5 text-xs text-gray-400">جاري البحث...</span>}
            </div>
            {warehouseNotFound && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>لا يوجد مخزن بهذا الرقم في هذه المجموعة</span>
              </div>
            )}
            {selectedWarehouse && (
              <div className="flex items-center gap-2 text-green-600 text-sm mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم العثور على المخزن</span>
              </div>
            )}
          </div>

          {selectedWarehouse && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-semibold">معلومات المخزن</p>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                {selectedWarehouse.group && <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> المجموعة: {selectedWarehouse.group.name}</span>}
                {selectedWarehouse.guard && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> الحارس: {selectedWarehouse.guard.fullName}</span>}
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> السعر: {Number(selectedWarehouse.pricePer6Months || selectedWarehouse.pricePerMonth * 6).toLocaleString()} / 6 أشهر</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> المساحة: {selectedWarehouse.area} م²</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>تاريخ البدء *</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>المدة (بالأشهر) *</Label>
              <Input type="number" min={isPreAgreed ? 1 : 6} value={durationMonths} onChange={e => setDurationMonths(e.target.value)} />
              {!isPreAgreed && <p className="text-xs text-red-500">أقل مدة 6 أشهر</p>}
            </div>
          </div>

          {startDate && durationMonths && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span>تاريخ الانتهاء المتوقع: <strong>{new Date(computeEndDate()).toLocaleDateString('ar-IQ')}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>التخفيض (مبلغ ثابت)</Label><Input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
            <div className="space-y-2"><Label>أجر الحارس (شهري)</Label><Input type="number" min="0" value={guardFeeMonthly} onChange={e => setGuardFeeMonthly(e.target.value)} /></div>
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold text-sm mb-3">معلومات المستأجر والمواد</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>رقم الهاتف 1</Label><Input type="text" value={tenantPhone} onChange={e => setTenantPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label>رقم الهاتف 2</Label><Input type="text" value={tenantPhone2} onChange={e => setTenantPhone2(e.target.value)} /></div>
            </div>
            <div className="space-y-2 mt-3">
              <Label>نوعية المواد المخزنة</Label>
              <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={storedMaterials} onChange={e => setStoredMaterials(e.target.value)} placeholder="مثال: مواد غذائية، قطع غيار، أثاث..." />
            </div>
          </div>

          {computeRentAmount() > 0 && (
            <div className="bg-green-50 p-4 rounded-lg space-y-1">
              <div className="flex justify-between text-sm"><span>إجمالي الإيجار:</span><span className="font-bold">{computeRentAmount().toLocaleString()} دينار</span></div>
              {parseFloat(guardFeeMonthly) > 0 && <div className="flex justify-between text-sm text-gray-500"><span>أجر الحارس (شهري):</span><span className="font-bold">{Number(guardFeeMonthly).toLocaleString()} دينار</span></div>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPreAgreed} onChange={e => setIsPreAgreed(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm">متفق عليه سابقاً (عقد بأثر رجعي)</span>
            </label>
            {isPreAgreed && <UserCheck className="w-4 h-4 text-orange-500" />}
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading || !warehouseId}>{loading ? 'جاري الإنشاء...' : 'إنشاء العقد'}</Button>
            <Button variant="outline" onClick={() => router.push('/admin/contracts')}>إلغاء</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
