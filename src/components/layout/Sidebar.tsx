'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { 
  Home, 
  FolderOpen, 
  CheckSquare, 
  Users, 
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLE_MENU_ITEMS, UserRole } from '@/lib/auth-guards'

interface NavigationItem {
  name: string
  href: string
  icon: any
  permission?: string
}

// 아이콘 매핑
const iconMap: Record<string, any> = {
  dashboard: Home,
  project: FolderOpen,
  task: CheckSquare,
  client: Building2,
  users: Users,
  organization: Building,
  report: BarChart3,
  settings: Settings,
}

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

export function Sidebar({ collapsed = false, onToggle, className = '' }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { allPermissions } = usePermissions()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    if (href === '/tasks') {
      return pathname === '/tasks' || pathname.startsWith('/tasks/')
    }
    return pathname.startsWith(href)
  }

  // 사용자 역할에 따른 메뉴 가져오기
  const userRole = session?.user?.role as UserRole
  const userMenuItems = userRole ? ROLE_MENU_ITEMS[userRole] || [] : []
  const allMenuItems = ROLE_MENU_ITEMS[UserRole.PMO] || []
  
  // 사용자가 접근할 수 있는 메뉴의 href 목록
  const userAccessibleHrefs = new Set(userMenuItems.map(item => item.href))
  
  // PMO의 모든 메뉴를 기준으로 네비게이션 생성
  const navigationItems = allMenuItems.map(item => ({
    name: item.label,
    href: item.href,
    icon: iconMap[item.icon] || Home,
    hasAccess: userAccessibleHrefs.has(item.href)
  }))

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      {/* 헤더 */}
      <div className={`flex items-center border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm ${
        collapsed ? 'flex-col p-2 space-y-2' : 'justify-between p-4'
      }`}>
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-white text-lg font-bold">PMS System</h1>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={`text-gray-400 hover:text-white hover:bg-gray-700/50 p-1 h-8 w-8 rounded-lg transition-all duration-200 ${
              collapsed ? 'flex-shrink-0' : ''
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className={`flex-1 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent ${
        collapsed ? 'px-2' : 'px-3'
      }`}>
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          if (item.hasAccess) {
            // 접근 가능한 메뉴
            return (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className={`${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:transform hover:scale-105'
                  } ${
                    collapsed 
                      ? 'flex items-center justify-center w-12 h-12 mx-auto rounded-xl' 
                      : 'flex items-center px-4 py-3 rounded-xl'
                  } text-sm font-medium transition-all duration-200 group relative overflow-hidden`}
                >
                  {/* 활성 상태 배경 효과 */}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl" />
                  )}
                  
                  <Icon className={`h-5 w-5 flex-shrink-0 relative z-10 ${
                    collapsed ? '' : 'mr-3'
                  } ${
                    active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`} />
                  {!collapsed && (
                    <span className="truncate relative z-10 font-medium">{item.name}</span>
                  )}
                  
                  {/* 호버 효과 */}
                  {!active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700/0 to-gray-600/0 group-hover:from-gray-700/30 group-hover:to-gray-600/30 rounded-xl transition-all duration-200" />
                  )}
                </Link>
                
                {/* 툴팁 (축소된 상태에서만 표시) */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-gray-600">
                    {item.name}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45 border-l border-b border-gray-600"></div>
                  </div>
                )}
              </div>
            )
          } else {
            // 접근 불가능한 메뉴 (비활성화)
            return (
              <div key={item.name} className="relative group">
                <div
                  className={`${
                    collapsed 
                      ? 'flex items-center justify-center w-12 h-12 mx-auto rounded-xl' 
                      : 'flex items-center px-4 py-3 rounded-xl'
                  } text-sm font-medium cursor-not-allowed relative overflow-hidden
                    text-gray-500 bg-gray-800/30 border border-dashed border-gray-600/50 opacity-50`}
                  title={`${item.name} - 접근 권한이 없습니다`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 relative z-10 text-gray-600 opacity-50 grayscale ${
                    collapsed ? '' : 'mr-3'
                  }`} />
                  {!collapsed && (
                    <>
                      <span className="truncate relative z-10 font-medium line-through decoration-gray-600 opacity-70">
                        {item.name}
                      </span>
                      <span className="ml-auto text-xs text-red-400 opacity-80">🔒</span>
                    </>
                  )}
                  
                  {/* 비활성화 오버레이 */}
                  <div className="absolute inset-0 bg-gray-700/20 rounded-xl" />
                </div>
                
                {/* 비활성화 툴팁 */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-red-600 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                    <div className="flex items-center gap-1">
                      <span>🚫</span>
                      <span>{item.name} - 접근 권한 없음</span>
                    </div>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-red-600 rotate-45"></div>
                  </div>
                )}
              </div>
            )
          }
        })}
      </nav>

      {/* 사용자 정보 */}
      <div className={`border-t border-gray-700 bg-gray-900/30 backdrop-blur-sm ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        {session && (
          <div className="space-y-4">
            {!collapsed && (
              <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <Avatar
                  src={session.user?.avatar_url}
                  alt={session.user?.name || 'User'}
                  fallback={session.user?.name?.charAt(0) || 'U'}
                  size="lg"
                  className="shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate bg-gray-700/50 px-2 py-1 rounded-full inline-block">
                    {session.user?.role}
                  </p>
                </div>
              </div>
            )}
            
            {collapsed && (
              <div className="flex justify-center relative group">
                <Avatar
                  src={session.user?.avatar_url}
                  alt={session.user?.name || 'User'}
                  fallback={session.user?.name?.charAt(0) || 'U'}
                  size="lg"
                  className="shadow-lg"
                />
                {/* 사용자 정보 툴팁 */}
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-gray-600">
                  <div className="text-center">
                    <p className="font-semibold">{session.user?.name}</p>
                    <p className="text-xs text-gray-300">{session.user?.role}</p>
                  </div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45 border-l border-b border-gray-600"></div>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className={`${
                collapsed 
                  ? 'w-12 h-12 p-0 mx-auto flex items-center justify-center' 
                  : 'w-full justify-start h-10'
              } text-gray-300 hover:text-white hover:bg-red-600/20 hover:border-red-500/50 border border-transparent rounded-xl transition-all duration-200 group relative`}
              title={collapsed ? '로그아웃' : undefined}
            >
              <LogOut className={`h-4 w-4 ${collapsed ? '' : 'mr-2'} group-hover:text-red-400 transition-colors duration-200`} />
              {!collapsed && <span className="font-medium">로그아웃</span>}
              
              {/* 로그아웃 툴팁 */}
              {collapsed && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-gray-600">
                  로그아웃
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45 border-l border-b border-gray-600"></div>
                </div>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 