'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { canAccessRoute } from '@/lib/auth-guards'
import { Loading } from '@/components/ui/loading'

interface RouteGuardProps {
  children: ReactNode
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return // 세션 로딩 중

    if (!session) {
      router.push('/login')
      return
    }

    if (!session.user?.role) {
      router.push('/login')
      return
    }

    // 현재 경로에 대한 접근 권한 확인
    if (!canAccessRoute(session.user.role, pathname)) {
      router.push('/dashboard')
      return
    }
  }, [session, status, pathname, router])

  if (status === 'loading') {
    return <Loading />
  }

  if (!session || !session.user?.role) {
    return <Loading />
  }

  if (!canAccessRoute(session.user.role, pathname)) {
    return <Loading />
  }

  return <>{children}</>
}