'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { data: session } = useSession()

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
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Search className="h-4 w-4" />
                </Button>
                
                {/* 알림 버튼 */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
                </Button>
                
                {/* 사용자 정보 */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-gray-500">{session.user?.role}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
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
    </header>
  )
} 