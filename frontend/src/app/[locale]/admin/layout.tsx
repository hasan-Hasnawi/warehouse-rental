'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from '@/i18n/navigation'
import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Package, Users, FileText, CreditCard, Building2, LogOut, Menu, ShieldAlert, BarChart3, Layers, CalendarCheck, Wifi, WifiOff, RefreshCw, Loader2, Bell } from 'lucide-react'
import { useState } from 'react'
import { useNetwork } from '@/lib/use-network'
import { useUnreadNotifications } from '@/lib/use-notifications'

const navItems = [
  { href: '/admin', label: 'نظرة عامة', icon: Building2 },
  { href: '/admin/warehouses', label: 'المخازن', icon: Package },
  { href: '/admin/inventory', label: 'المخزون', icon: Package },
  { href: '/admin/groups', label: 'المجموعات', icon: Layers },
  { href: '/admin/contracts', label: 'العقود', icon: FileText },
  { href: '/admin/clients', label: 'المستأجرون', icon: Users },
  { href: '/admin/bookings', label: 'الحجوزات', icon: CalendarCheck },
  { href: '/admin/payments', label: 'المدفوعات', icon: CreditCard },
  { href: '/admin/guards', label: 'الحراس', icon: ShieldAlert },
  { href: '/admin/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/admin/reports', label: 'التقارير', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isOnline, isSyncing, pendingCount, syncNow, lastSyncResult } = useNetwork()
  const { unreadCount } = useUnreadNotifications()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen flex">
      <aside className={`bg-gradient-to-b from-white to-yellow-50 border-l border-yellow-100 w-64 fixed inset-y-0 right-0 z-30 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-yellow-100 bg-gradient-to-r from-yellow-400 to-yellow-500">
          <h2 className="font-bold text-lg text-yellow-950">لوحة المدير</h2>
          <p className="text-sm text-yellow-800">{user.fullName}</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-yellow-100 text-gray-700 hover:text-yellow-900 transition-all duration-200"
            >
              <item.icon className="w-5 h-5 text-yellow-600" />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => { logout(); router.push('/auth/login') }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 w-full mt-4 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-yellow-100 px-6 py-4 flex items-center justify-between lg:justify-end shadow-sm">
          <button className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <Link href="/admin/notifications" className="relative p-2 hover:bg-yellow-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-yellow-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </Link>
            {!isOnline && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                غير متصل{pendingCount > 0 && ` (${pendingCount} معلقة)`}
              </span>
            )}
            {isOnline && isSyncing && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                جاري المزامنة...
              </span>
            )}
            {isOnline && pendingCount > 0 && !isSyncing && (
              <button onClick={syncNow} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium hover:bg-yellow-100 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                {pendingCount} معلقة - مزامنة
              </button>
            )}
            {lastSyncResult && isOnline && !isSyncing && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                {lastSyncResult}
              </span>
            )}
            {isOnline && pendingCount === 0 && !isSyncing && !lastSyncResult && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Wifi className="w-3.5 h-3.5 text-green-500" />
                متصل
              </span>
            )}
            <span className="text-sm text-gray-500">{user.fullName}</span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-white to-yellow-50/30">{children}</main>
      </div>
    </div>
  )
}
