'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROLE_MENU_ITEMS, UserRole } from '@/lib/auth-guards'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  href: string
  icon: string
}

export default function RoleBasedMenu() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user?.role) {
    return null
  }

  const userRole = session.user.role
  // PMO의 모든 메뉴를 기준으로 하되, 사용자 권한에 따라 활성화/비활성화 처리
  const allMenuItems = ROLE_MENU_ITEMS[UserRole.PMO]
  const userMenuItems = ROLE_MENU_ITEMS[userRole] || []
  
  // 사용자가 접근할 수 있는 메뉴의 href 목록
  const userAccessibleHrefs = new Set(userMenuItems.map(item => item.href))

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'dashboard':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
        )
      case 'users':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        )
      case 'organization':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      case 'project':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
      case 'client':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      case 'report':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'task':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'settings':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <nav className="space-y-1 p-2">
      {allMenuItems.map((item: MenuItem, index) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        const hasAccess = userAccessibleHrefs.has(item.href)
        
        // 디버깅용 로그 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          console.log(`Menu item: ${item.label} (${item.href}), User role: ${userRole}, Has access: ${hasAccess}`)
        }

        // 섹션 구분선 추가 조건
        const shouldShowDivider = index === 0 || (item.href === '/clients' && index > 0)

        if (hasAccess) {
          return (
            <div key={item.href}>
              {shouldShowDivider && index > 0 && (
                <div className="my-3 border-t border-gray-200/60"></div>
              )}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  'border border-transparent hover:shadow-sm group',
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm font-semibold'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:border-gray-200'
                )}
              >
                <span className={cn(
                  "mr-3 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                )}>
                  {getIcon(item.icon)}
                </span>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </Link>
            </div>
          )
        } else {
          return (
            <div key={item.href}>
              {shouldShowDivider && index > 0 && (
                <div className="my-3 border-t border-gray-200/60"></div>
              )}
              <div
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-not-allowed relative group',
                  'text-gray-400 bg-gray-50 border-2 border-dashed border-gray-200',
                  'opacity-60 select-none transition-all duration-200'
                )}
                title={`${item.label} - 접근 권한이 없습니다`}
              >
                <span className="mr-3 opacity-40 grayscale filter">
                  {getIcon(item.icon)}
                </span>
                <span className="opacity-70 line-through decoration-gray-400 decoration-2">
                  {item.label}
                </span>
                <span className="ml-auto text-xs opacity-80 text-red-500 font-bold">
                  🔒
                </span>
                
                {/* 비활성화 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100/30 to-gray-200/30 rounded-lg"></div>
                
                {/* 개선된 툴팁 */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-red-600 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🚫</span>
                    <span className="font-medium">접근 권한이 없습니다</span>
                  </div>
                  {/* 툴팁 화살표 */}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-red-600"></div>
                </div>
              </div>
            </div>
          )
        }
      })}
    </nav>
  )
} 