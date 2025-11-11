import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const adminPaths = ['/dashboard']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAdminRoute = adminPaths.some((path) => pathname.startsWith(path))

  if (!isAdminRoute) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token || token.role !== 'admin') {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    loginUrl.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}

