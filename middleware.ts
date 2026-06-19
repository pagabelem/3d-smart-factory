import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const publicRoutes = ['/login']
  
  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role
      const dashboardUrl = new URL(`/${role?.toLowerCase()}`, req.url)
      return NextResponse.redirect(dashboardUrl)
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  const role = req.auth?.user?.role
  const isAdmin = role === 'ADMIN'
  const isEncadrant = role === 'ENCADRANT'
  const isStagiaire = role === 'STAGIAIRE'

  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  if (pathname.startsWith('/encadrant') && !isEncadrant && !isAdmin) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  if (pathname.startsWith('/stagiaire') && !isStagiaire && !isAdmin && !isEncadrant) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}