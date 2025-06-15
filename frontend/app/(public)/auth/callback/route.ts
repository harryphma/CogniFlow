import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Create response first
  const response = NextResponse.redirect(new URL('/new', request.url))
  const cookieStore = await cookies()
  // Create Supabase client with specific cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        // get(name: string) {
        //   return request.cookies.get(name)?.value
        // },
        // set(name: string, value: string, options: CookieOptions) {
        //   // Set cookie with specific domain and other options
        //   response.cookies.set({
        //     name,
        //     value,
        //     domain: request.nextUrl.hostname,
        //     path: '/',
        //     maxAge: 60, // 1 minute
        //     expires: new Date(Date.now() + 60 * 1000), // Also set explicit expiration
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'lax'
        //   })
        //   console.log(`Cookie set in callback: ${name}`)
        // },
        // remove(name: string, options: CookieOptions) {
        //   response.cookies.set({
        //     name,
        //     value: '',
        //     path: '/',
        //     expires: new Date(0)
        //   })
        //   console.log(`Cookie removed in callback: ${name}`)
        // }
      },
    }
  )

  try {
    if (!code) {
      throw new Error('No code provided')
    }

    // Exchange code for session
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Session exchange error:', error.message)
      throw error
    }

    if (!session) {
      throw new Error('No session received')
    }

    // Log success but not sensitive data
    console.log('Auth successful, session established for:', session.user.email)
    console.log(
      'Cookies present:',
      response.cookies.getAll().map(c => c.name)
    )

    return response
  } catch (error) {
    console.error('Auth error:', error)

    // Clear auth cookies
    const cookiesToClear = request.cookies.getAll()
    cookiesToClear.forEach(cookie => {
      if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
        response.cookies.set({
          name: cookie.name,
          value: '',
          path: '/',
          expires: new Date(0),
        })
      }
    })

    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}
