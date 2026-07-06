'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Store, FileText, CreditCard, Package, Wrench, CalendarCheck, LogOut, Menu, Bell } from 'lucide-react'
import { useUnreadNotifications } from '@/lib/use-notifications'

const navItems = [
  { href: '/client', label: 'كتالوج المخازن', icon: Store },
  { href: '/client/contracts', label: 'عقودي', icon: FileText },
  { href: '/client/payments', label: 'مدفوعاتي', icon: CreditCard },
  { href: '/client/inventory', label: 'المخزون', icon: Package },
  { href: '/client/services', label: 'خدمات إضافية', icon: Wrench },
  { href: '/client/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/client/bookings', label: 'حجوزاتي', icon: CalendarCheck },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { unreadCount } = useUnreadNotifications()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'CLIENT')) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>
  if (!user || user.role !== 'CLIENT') return null

  return (
    <div className="min-h-screen flex">
      <aside className={`bg-white border-l w-64 fixed inset-y-0 right-0 z-30 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b">
          <h2 className="font-bold text-lg">بوابة المستأجر</h2>
          <p className="text-sm text-gray-500">{user.fullName}</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
          <button onClick={() => { logout(); router.push('/auth/login') }} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 w-full mt-4">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between lg:justify-end">
          <button className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="w-6 h-6" /></button>
          <Link href="/client/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
