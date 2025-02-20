import { NextRequest, NextResponse } from 'next/server'
import { betterFetch } from '@better-fetch/fetch'

import type { auth } from '@/lib/auth'

type Session = typeof auth.$Infer.Session

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  })

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/workspaces/:path*',
    '/admin/:path*',
    '/api/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
