'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Layers, DollarSign, CalendarDays, BadgePercent, UserCheck, Phone, Package } from 'lucide-react'

export default function CreateContractPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null)
  const [startDate, setStartDate] = useState('')
  const [durationMonths, setDurationMonths] = useState('6')
  const [discount, setDiscount] = useState('0')
  const [guardFeeMonthly, setGuardFeeMonthly] = useState('0')
  const [isPreAgreed, setIsPreAgreed] = useState(false)
  const [notes, setNotes] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientPhone2, setClientPhone2] = useState('')
  const [storedMaterials, setStoredMaterials] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.admin.listUsers('CLIENT').then(setClients).catch(console.error)
    api.warehouses.list('status=VACANT').then(setWarehouses).catch(console.error)
  }, [])

  useEffect(() => {
    if (clientId) {
      const c = clients.find(c => c.id === clientId)
      if (c) {
        setClientPhone(c.phone || '')
        setClientPhone2('')
      }
    }
  }, [clientId, clients])

  useEffect(() => {
    if (warehouseId) {
      const wh = warehouses.find(w => w.id === warehouseId)
      setSelectedWarehouse(wh || null)
    } else {
      setSelectedWarehouse(null)
    }
  }, [warehouseId, warehouses])

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

  const computeDeposit = () => {
    const months = parseInt(durationMonths) || 6
    const rentPerMonth = computeRentAmount() / months
    return Math.round(rentPerMonth / 2)
  }

  const handleSubmit = async () => {
    if (!clientId || !warehouseId || !startDate) {
      alert('يرجى تعبئة جميع الحقول المطلوبة')
      return
    }

    const months = parseInt(durationMonths)
    if (!isPreAgreed && months < 6) {
      alert('أقل مدة للعقد هي 6 أشهر')
      return
    }

    const endDate = computeEndDate()
    const rentAmount = computeRentAmount()
    const depositAmount = computeDeposit()

    setLoading(true)
    try {
      await api.contracts.create({
        clientId, warehouseId, startDate, endDate,
        rentAmount, depositAmount,
        discount: parseFloat(discount) || 0,
        guardFeeMonthly: parseFloat(guardFeeMonthly) || 0,
        isPreAgreed,
        clientPhone: clientPhone || undefined,
        clientPhone2: clientPhone2 || undefined,
        storedMaterials: storedMaterials || undefined,
        notes,
      })
      router.push('/admin/contracts')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إنشاء عقد جديد</h1>
        <p className="text-gray-500">أدخل تفاصيل العقد الجديد</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات العقد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المستأجر *</Label>
              <Select value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">اختر المستأجر</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المخزن *</Label>
              <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                <option value="">اختر المخزن</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code}) - {w.city}</option>)}
              </Select>
            </div>
          </div>

          {selectedWarehouse && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-semibold">معلومات المخزن</p>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                {selectedWarehouse.group && (
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> المجموعة: {selectedWarehouse.group.name}</span>
                )}
                {selectedWarehouse.guard && (
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> الحارس: {selectedWarehouse.guard.fullName}</span>
                )}
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> السعر: {Number(selectedWarehouse.pricePer6Months || selectedWarehouse.pricePerMonth * 6).toLocaleString()} / 6 أشهر</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> المساحة: {selectedWarehouse.area} م²</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ البدء *</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
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
            <div className="space-y-2">
              <Label>التخفيض (مبلغ ثابت)</Label>
              <div className="relative">
                <Input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} />
                <BadgePercent className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>أجر الحارس (شهري)</Label>
              <Input type="number" min="0" value={guardFeeMonthly} onChange={e => setGuardFeeMonthly(e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold text-sm mb-3">معلومات المستأجر والمواد</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الهاتف 1</Label>
                <div className="relative">
                  <Input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف 2</Label>
                <div className="relative">
                  <Input type="text" value={clientPhone2} onChange={e => setClientPhone2(e.target.value)} />
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <Label>نوعية المواد المخزنة</Label>
              <div className="relative">
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={2}
                  value={storedMaterials}
                  onChange={e => setStoredMaterials(e.target.value)}
                  placeholder="مثال: مواد غذائية، قطع غيار، أثاث..."
                />
                <Package className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {computeRentAmount() > 0 && (
            <div className="bg-green-50 p-4 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>إجمالي الإيجار:</span>
                <span className="font-bold">{computeRentAmount().toLocaleString()} دينار</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>التأمين:</span>
                <span className="font-bold">{computeDeposit().toLocaleString()} دينار</span>
              </div>
              {parseFloat(guardFeeMonthly) > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>أجر الحارس (شهري):</span>
                  <span className="font-bold">{Number(guardFeeMonthly).toLocaleString()} دينار</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPreAgreed} onChange={e => setIsPreAgreed(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm">متفق عليه سابقاً (عقد بأثر رجعي)</span>
            </Label>
            {isPreAgreed && <UserCheck className="w-4 h-4 text-orange-500" />}
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading}>{loading ? 'جاري الإنشاء...' : 'إنشاء العقد'}</Button>
            <Button variant="outline" onClick={() => router.push('/admin/contracts')}>إلغاء</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
