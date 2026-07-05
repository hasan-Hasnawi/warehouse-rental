'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/lib/auth-context'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const user = await login(email, password)
      if (user.role === 'ADMIN') router.push('/admin')
      else if (user.role === 'GUARD') router.push('/guard')
      else router.push('/client')
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-teal-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-yellow-100">
        <CardHeader className="text-center bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-t-lg">
          <CardTitle className="text-2xl text-yellow-950">تسجيل الدخول</CardTitle>
          <CardDescription className="text-yellow-800">أدخل بريدك الإلكتروني وكلمة المرور</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sotrage.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 hover:from-yellow-500 hover:to-yellow-600 shadow-sm">
              تسجيل الدخول
            </Button>
          </form>
          <p className="text-center text-sm mt-4 text-gray-500">
            ليس لديك حساب؟{' '}
            <Link href="/auth/register" className="text-teal-600 hover:underline font-medium">
              إنشاء حساب
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
