import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

 // ... kodi ekzistues sipër mbetet i njëjtë

  const { data: { session } } = await supabase.auth.getSession()
  const path = request.nextUrl.pathname

  const isDashboardRoute = path.startsWith('/dashboard')
  const isAdminRoute = path.startsWith('/admin')
  const isProtectedRoute = isDashboardRoute || isAdminRoute

  // 1. Mbrojtja e Rrugëve Private
  if (!session && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Menaxhimi i Roleve nëse përdoruesi është i kyçur
  if (session) {
    // Lexojmë rolin direkt nga databaza për të mos lejuar manipulime nga klienti
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = userData?.role

    // Nëse është në /login, e kthejmë te paneli i tij
    if (path === '/login') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
      if (role === 'supervisor') return NextResponse.redirect(new URL('/dashboard', request.url))
      // Punonjësit e terrenit nuk duhet të kalojnë përtej login në web
      await supabase.auth.signOut()
      return response
    }

    // RBAC: Ndalimi i Supervizorit të hyjë te Admin
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}