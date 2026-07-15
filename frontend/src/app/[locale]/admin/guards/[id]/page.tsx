'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Phone, Mail, Warehouse, ClipboardList, Plus, CheckCircle, XCircle, Edit2 } from 'lucide-react'

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const priorityText: Record<string, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'طارئة',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

const statusText: Record<string, string> = {
  pending: 'جديد',
  in_progress: 'قيد التنفيذ',
  completed: 'تم',
  cancelled: 'ملغي',
}

export default function GuardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [guard, setGuard] = useState<any>(null)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'normal', warehouseId: '' })
  const [taskLoading, setTaskLoading] = useState(false)

  const load = () => {
    if (!params.id) return
    api.admin.listUsers('GUARD').then(users => {
      const g = users.find((u: any) => u.id === params.id)
      if (g) setGuard(g)
      else router.push('/admin/guards')
    }).catch(() => router.push('/admin/guards'))

    api.warehouses.list(`guardId=${params.id}`).then(setWarehouses).catch(console.error)
    api.guards.tasks.list(params.id as string).then(setTasks).catch(console.error)
  }

  useEffect(() => { load() }, [params.id])

  const handleCreateTask = async () => {
    if (!taskForm.title) { alert('يرجى كتابة عنوان المهمة'); return }
    setTaskLoading(true)
    try {
      await api.guards.tasks.create({
        guardId: params.id,
        warehouseId: taskForm.warehouseId || undefined,
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
      })
      setTaskForm({ title: '', description: '', priority: 'normal', warehouseId: '' })
      setShowTaskForm(false)
      api.guards.tasks.list(params.id as string).then(setTasks).catch(console.error)
    } catch (err: any) { alert(err.message) }
    finally { setTaskLoading(false) }
  }

  const handleTaskStatus = async (taskId: string, status: string) => {
    try {
      await api.guards.tasks.updateStatus(taskId, status)
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t))
    } catch (err: any) { alert(err.message) }
  }

  if (!guard) return <div className="text-center text-gray-500 py-12">جاري التحميل...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push('/admin/guards')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> العودة للحراس
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-amber-500" /> {guard.fullName}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/guards')} className="flex items-center gap-1">
              <Edit2 className="w-4 h-4" /> تعديل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">البريد</p><p className="font-medium">{guard.email}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">الهاتف</p><p className="font-medium">{guard.phone}</p></div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">الحالة</p><Badge variant={guard.isActive ? 'default' : 'secondary'}>{guard.isActive ? 'نشط' : 'غير نشط'}</Badge></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Warehouse className="w-5 h-5" /> المخازن التابعة ({warehouses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 && <p className="text-gray-500 text-center py-4">لا توجد مخازن تابعة لهذا الحارس</p>}
          <div className="grid gap-2">
            {warehouses.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{w.name} <span className="text-gray-400 text-sm">({w.code})</span></p>
                  <p className="text-xs text-gray-500">{w.city} - {w.address}</p>
                </div>
                <Badge className={w.status === 'VACANT' ? 'bg-green-100 text-green-700' : w.status === 'RENTED' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                  {w.status === 'VACANT' ? 'شاغر' : w.status === 'RENTED' ? 'مؤجر' : 'صيانة'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> المهام ({tasks.length})</CardTitle>
          <Button size="sm" onClick={() => setShowTaskForm(!showTaskForm)} className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> مهمة جديدة
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showTaskForm && (
            <Card className="border-2 border-amber-300 bg-amber-50">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1"><Label>عنوان المهمة</Label><Input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="عنوان المهمة..." /></div>
                <div className="space-y-1"><Label>الوصف</Label><Input value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="وصف المهمة..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>المخزن</Label>
                    <select value={taskForm.warehouseId} onChange={e => setTaskForm({ ...taskForm, warehouseId: e.target.value })} className="w-full border rounded-lg p-2 text-sm">
                      <option value="">بدون مخزن محدد</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><Label>الأولوية</Label>
                    <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full border rounded-lg p-2 text-sm">
                      <option value="low">منخفضة</option>
                      <option value="normal">عادية</option>
                      <option value="high">عالية</option>
                      <option value="urgent">طارئة</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateTask} disabled={taskLoading}>{taskLoading ? 'جاري...' : 'إرسال المهمة'}</Button>
                  <Button variant="outline" onClick={() => setShowTaskForm(false)}>إلغاء</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tasks.length === 0 && <p className="text-gray-500 text-center py-4">لا توجد مهام</p>}
          {tasks.map(t => (
            <div key={t.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t.title}</span>
                    <Badge className={priorityColor[t.priority]}>{priorityText[t.priority]}</Badge>
                    <Badge className={statusColor[t.status]}>{statusText[t.status]}</Badge>
                  </div>
                  {t.description && <p className="text-sm text-gray-600">{t.description}</p>}
                  <p className="text-xs text-gray-400">
                    {t.warehouse && <span>المخزن: {t.warehouse.name} • </span>}
                    بواسطة: {t.creator?.fullName} • {new Date(t.createdAt).toLocaleDateString('ar-IQ')}
                  </p>
                </div>
                <div className="flex gap-1">
                  {t.status === 'pending' && (
                    <button onClick={() => handleTaskStatus(t.id, 'in_progress')} className="p-1 hover:bg-blue-100 rounded text-blue-600 text-xs">قيد التنفيذ</button>
                  )}
                  {t.status === 'in_progress' && (
                    <button onClick={() => handleTaskStatus(t.id, 'completed')} className="p-1 hover:bg-green-100 rounded text-green-600 text-xs"><CheckCircle className="w-4 h-4" /></button>
                  )}
                  {(t.status === 'pending' || t.status === 'in_progress') && (
                    <button onClick={() => handleTaskStatus(t.id, 'cancelled')} className="p-1 hover:bg-red-100 rounded text-red-600 text-xs"><XCircle className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
