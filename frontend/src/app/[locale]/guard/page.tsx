'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScanLine, FileText, Wallet, AlertTriangle, LogIn, LogOut, Truck, AlertCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export default function GuardDashboard() {
  const [logs, setLogs] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])

  useEffect(() => {
    api.guards.getAccessLogs().then(setLogs).catch(console.error)
    api.guards.getCollections().then(setCollections).catch(console.error)
  }, [])

  const todayLogs = logs.filter(l =>
    new Date(l.timestamp).toDateString() === new Date().toDateString()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم الحارس</h1>
          <p className="text-gray-500">{todayLogs.length} تسجيل اليوم</p>
        </div>
        <Link href="/guard/reports">
          <Button variant="destructive" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> بلاغ طارئ
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/guard/access">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <ScanLine className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold">تسجيل دخول</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/guard/access">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <LogOut className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="font-semibold">تسجيل خروج</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/guard/collections">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Wallet className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold">تحصيل</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/guard/reports">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="font-semibold">بلاغ</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>آخر عمليات الدخول</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div className="flex items-center gap-2">
                    {log.action === 'entry' && <LogIn className="w-4 h-4 text-green-500" />}
                    {log.action === 'exit' && <LogOut className="w-4 h-4 text-orange-500" />}
                    {log.action === 'shipment_in' && <Truck className="w-4 h-4 text-blue-500" />}
                    <span>{log.warehouse?.name || 'مخزن'}</span>
                  </div>
                  <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString('ar-IQ')}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-gray-500 text-center py-4">لا توجد تسجيلات اليوم</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>آخر التحصيلات</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collections.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <span>{c.client?.fullName || 'نقدي'}</span>
                  <span className="font-bold text-green-600">{Number(c.amount).toLocaleString()} د.ع</span>
                </div>
              ))}
              {collections.length === 0 && <p className="text-gray-500 text-center py-4">لا توجد تحصيلات</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
