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

  // PËRDORIMI I getSession() NËSTEKSTIN E MIDDLEWARE PËR TË SHMANGUR GABIMET E RRETIT
  const { data: { session } } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname

  // 1. Nëse përdoruesi NUK është i kyçur dhe po tenton të hyjë te /dashboard (ose çdo gjë tjetër përveç /login)
  if (!session && path.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Nëse përdoruesi ÉSHTË i kyçur dhe ndodhet te /login, dërgoje direkt te /dashboard
  if (session && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Përfshi vetëm rrugët që kërkojnë kontroll, ose përjashto qartësisht skedarët statikë.
     * Kjo siguron që faqja e login-it dhe root (/) të mos bllokohen në unazë.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}