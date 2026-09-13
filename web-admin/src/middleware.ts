import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Inicializimi i Supabase SSR Client
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

  // 2. Siguria Absolute: Përdorim getUser() për verifikim të padiskutueshëm server-side
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  const path = request.nextUrl.pathname

  const isDashboardRoute = path.startsWith('/dashboard')
  const isAdminRoute = path.startsWith('/admin')
  const isAuthRoute = path.startsWith('/login')
  
  const isProtectedRoute = isDashboardRoute || isAdminRoute

  // 3. Mbrojtja e Rrugëve Private (Nëse NUK ka User -> kthe te Login)
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 4. Logjika e Roleve (Nëse KEMI një përdorues valid)
  if (user && !userError) {
    // Lexojmë rolin direkt nga databaza për të mos lejuar manipulime
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role

    // Nëse është i kyçur dhe tenton të hapë faqen /login, ridrejtoje sipas rolit
    if (isAuthRoute) {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
      if (role === 'supervisor') return NextResponse.redirect(new URL('/dashboard', request.url))
      
      // Punonjësit e terrenit nuk duhet të kalojnë përtej login në web
      await supabase.auth.signOut()
      return response
    }

    // RBAC (Role-Based Access Control):
    // Supervizori nuk mund të futet asnjëherë te /admin
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Punonjësit e terrenit bllokohen totalisht nga Web-i (përdorin vetëm mobile)
    if (isProtectedRoute && role !== 'admin' && role !== 'supervisor') {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Përputhet me të gjitha rrugët, PËRVEÇ:
     * - Rrugët API (_next/static, _next/image, favicon.ico)
     * - Asistencës grafike dhe skedarëve (svg, png, jpg, etj)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}