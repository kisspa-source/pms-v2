'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Button } from '@/components/ui/button'
import { Menu, X, Building2 } from 'lucide-react'

interface MainLayoutProps {
  children: React.ReactNode
}

function MainLayout({ children }: MainLayoutProps) {
  const { data: session } = useSession()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(false)
        setMobileMenuOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 로그인하지 않은 경우 사이드바 숨김
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 모바일 오버레이 */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } shadow-2xl`
          : 'relative flex-shrink-0'
      }`}>
        <Sidebar 
          collapsed={!isMobile && sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={isMobile ? 'w-64 h-full' : 'h-full'}
        />
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 모바일 헤더 */}
        {isMobile && (
          <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 px-4 py-3 flex items-center justify-between lg:hidden sticky top-0 z-30">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-700" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700" />
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">PMS System</h1>
              </div>
            </div>
            
            {/* 모바일 사용자 정보 */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.role}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">
                  {session.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 데스크톱 헤더 */}
        {!isMobile && <Header />}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gradient-to-br from-gray-50 to-gray-100 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
export { MainLayout } 