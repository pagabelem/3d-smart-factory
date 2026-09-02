import { auth } from '@/src/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const publicRoutes = ['/login', '/register']
  
  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role
      // Rediriger vers le dashboard du rôle
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard/admin', req.url))
      if (role === 'ENCADRANT') return NextResponse.redirect(new URL('/dashboard/encadrant', req.url))
      if (role === 'STAGIAIRE') return NextResponse.redirect(new URL('/dashboard/stagiaire', req.url))
      return NextResponse.redirect(new URL('/dashboard', req.url))
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

  // Protéger les routes par rôle
  if (pathname.startsWith('/dashboard/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  if (pathname.startsWith('/dashboard/encadrant') && !isEncadrant && !isAdmin) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  if (pathname.startsWith('/dashboard/stagiaire') && !isStagiaire && !isAdmin && !isEncadrant) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
}