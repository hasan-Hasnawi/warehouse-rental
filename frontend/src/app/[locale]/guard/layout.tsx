'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Shield, ScanLine, FileText, Wallet, AlertTriangle, LogOut, Menu, WifiOff } from 'lucide-react'

const navItems = [
  { href: '/guard', label: 'لوحة التحكم', icon: Shield },
  { href: '/guard/access', label: 'تسجيل الدخول', icon: ScanLine },
  { href: '/guard/reports', label: 'التقارير', icon: FileText },
  { href: '/guard/collections', label: 'التحصيلات', icon: Wallet },
]

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'GUARD')) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const handler = () => setIsOffline(!navigator.onLine)
    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    return () => {
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)
    }
  }, [])

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>
  if (!user || user.role !== 'GUARD') return null

  return (
    <div className="min-h-screen flex">
      {isOffline && (
        <div className="fixed top-0 inset-x-0 bg-yellow-500 text-white text-center py-2 z-50 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" /> وضع عدم الاتصال - سيتم المزامنة تلقائياً
        </div>
      )}
      <aside className={`bg-white border-l w-64 fixed inset-y-0 right-0 z-30 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b">
          <h2 className="font-bold text-lg">واجهة الحارس</h2>
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
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
