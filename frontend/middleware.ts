import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['ar', 'en', 'ku']
const defaultLocale = 'ar'

function getLocale(request: NextRequest): string {
  const acceptLang = request.headers.get('accept-language')
  if (!acceptLang) return defaultLocale

  const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
  if (preferred && locales.includes(preferred)) return preferred
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return NextResponse.next()

  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!_next|api|favicon|images|fonts).*)'],
}
