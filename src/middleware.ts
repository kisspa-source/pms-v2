import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { canAccessRoute } from '@/lib/auth-guards'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/login')
    const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard')
    const isApiAuthPage = req.nextUrl.pathname.startsWith('/api/auth')
    const isApiPage = req.nextUrl.pathname.startsWith('/api/')
    const isRootPage = req.nextUrl.pathname === '/'

    // API 인증 페이지는 통과
    if (isApiAuthPage) {
      return null
    }

    // API 라우트는 별도 처리 (API 내부에서 권한 검증)
    if (isApiPage) {
      return null
    }

    // 루트 페이지는 클라이언트에서 처리하도록 통과
    if (isRootPage) {
      return null
    }

    // 로그인 페이지 처리
    if (isAuthPage) {
      // 이미 인증된 사용자는 대시보드로 리디렉트 (무한 루프 방지)
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return null
    }

    // 보호된 페이지들에 대해서만 인증 확인
    const protectedPages = [
      '/dashboard',
      '/projects',
      '/tasks',
      '/clients',
      '/users',
      '/organizations',
      '/reports',
      '/settings',
      '/time-tracking',
      '/notifications'
    ]

    const isProtectedPage = protectedPages.some(page => 
      req.nextUrl.pathname.startsWith(page)
    )

    // 보호된 페이지에 대해서만 인증 확인
    if (isProtectedPage) {
      // 인증되지 않은 사용자는 로그인으로 리디렉트
      if (!isAuth) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // 역할별 라우트 접근 권한 확인
      const userRole = token?.role
      const currentPath = req.nextUrl.pathname

      // 대시보드 페이지는 모든 인증된 사용자에게 허용
      if (isDashboardPage) {
        return null
      }

      // 다른 페이지에 대한 역할별 권한 확인
      if (userRole && !canAccessRoute(userRole, currentPath)) {
        // 권한이 없는 경우 대시보드로 리디렉트
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return null
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 루트 페이지와 로그인 페이지는 항상 허용
        if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/login')) {
          return true
        }
        // 보호된 페이지에 대해서만 토큰 확인
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 