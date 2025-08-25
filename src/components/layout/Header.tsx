'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bell, Search, User, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import GlobalSearchModal from '@/components/search/GlobalSearchModal'
import RealTimeNotification from '@/components/notifications/RealTimeNotification'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { useSocket } from '@/hooks/useSocket'

export function Header() {
  const { data: session } = useSession()
  const { isSearchOpen, openSearch, closeSearch } = useGlobalSearch()
  const { createNotification, isConnected } = useSocket()

  const testNotification = () => {
    if (session?.user) {
      createNotification(
        '테스트 알림',
        '알림 기능이 정상적으로 작동합니다!',
        'success',
        session.user.id
      )
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 (데스크톱에서만 표시) */}
          <div className="hidden lg:flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              PMS System
            </Link>
          </div>
          
          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-4 ml-auto">
            {session ? (
              <>
                {/* 검색 버튼 */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex"
                  onClick={openSearch}
                  title="전역 검색 (Ctrl+K)"
                >
                  <Search className="h-4 w-4" />
                </Button>
                
                {/* 테스트 알림 버튼 (개발용) */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={testNotification}
                  className="hidden sm:flex"
                  title={`알림 테스트 (소켓 연결: ${isConnected ? '연결됨' : '연결 안됨'})`}
                >
                  <TestTube className="h-4 w-4" />
                </Button>
                
                {/* 실시간 알림 */}
                <RealTimeNotification />
                
                {/* 사용자 정보 */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-gray-500">{session.user?.role}</p>
                  </div>
                  <Avatar
                    src={session.user?.avatar_url}
                    alt={session.user?.name || 'User'}
                    fallback={session.user?.name?.charAt(0) || 'U'}
                    size="md"
                  />
                </div>
                
                {/* 로그아웃 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="hidden sm:flex text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* 전역 검색 모달 */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </header>
  )
} 