'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Building2, Loader2 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // 이미 리다이렉트 중이면 중복 실행 방지
    if (isRedirecting) return
    
    // 로딩 중일 때는 아무것도 하지 않음
    if (status === 'loading') return
    
    // 세션이 있으면 대시보드로, 없으면 로그인으로
    if (status === 'authenticated' && session) {
      setIsRedirecting(true)
      router.push('/dashboard')
    } else if (status === 'unauthenticated') {
      setIsRedirecting(true)
      router.push('/login')
    }
  }, [session, status, router, isRedirecting])

  // 로딩 중일 때 표시할 컴포넌트
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gradient-bg-blue relative overflow-hidden">
        {/* 배경 장식 요소들 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="text-center relative z-10 fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-8 shadow-large bounce-in">
            <Building2 className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-6xl font-bold mb-6 text-white drop-shadow-lg">
            PMS System
          </h1>
          <p className="text-2xl text-white/90 mb-12 font-light">
            Project Management System
          </p>
          <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-medium">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-white/90 text-lg font-medium">인증 상태 확인 중...</p>
          </div>
        </div>
      </main>
    )
  }

  // 기본 페이지 (리디렉션 전에 잠깐 보이는 페이지)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gradient-bg-modern relative overflow-hidden">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>
      
      <div className="text-center relative z-10 fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-8 shadow-large hover-scale bounce-in">
          <Building2 className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-6xl font-bold mb-6 text-white drop-shadow-lg">
          PMS System
        </h1>
        <p className="text-2xl text-white/90 mb-12 font-light">
          Project Management System
        </p>
        <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-medium">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/90 text-lg font-medium">시스템 초기화 중...</p>
        </div>
      </div>
    </main>
  )
} 