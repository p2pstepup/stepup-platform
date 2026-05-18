import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  // Redirect any Vercel preview/deployment URLs to the canonical domain
  if (host.includes('vercel.app')) {
    const url = request.nextUrl.clone()
    url.host = 'p2pmedprep.com'
    url.protocol = 'https'
    url.port = ''
    return NextResponse.redirect(url, { status: 301 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
