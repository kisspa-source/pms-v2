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
import { usePermissions } from '@/hooks/usePermissions'

interface NavigationItem {
  name: string
  href: string
  icon: any
  permission?: string
}

const navigation: NavigationItem[] = [
  { name: '대시보드', href: '/dashboard', icon: Home },
  { name: '프로젝트', href: '/projects', icon: FolderOpen },
  { name: '작업', href: '/tasks', icon: CheckSquare },
  { name: '고객사', href: '/clients', icon: Building2 },
  { name: '사용자', href: '/users', icon: Users },
  { name: '조직 관리', href: '/organizations', icon: Building, permission: 'canManageOrganizations' },
  { name: '보고서', href: '/reports', icon: BarChart3 },
  { name: '설정', href: '/settings', icon: Settings },
]

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

  // 권한에 따라 메뉴 필터링
  const filteredNavigation = navigation.filter(item => {
    if (item.permission) {
      return allPermissions[item.permission as keyof typeof allPermissions]
    }
    return true
  })

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-white text-lg font-bold">PMS System</h1>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
            <Building2 className="h-5 w-5 text-white" />
          </div>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-1 h-8 w-8 rounded-lg transition-all duration-200"
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
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                className={`${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:transform hover:scale-105'
                } flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden`}
              >
                {/* 활성 상태 배경 효과 */}
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl" />
                )}
                
                <Icon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0 relative z-10 ${
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
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-gray-600">
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45 border-l border-b border-gray-600"></div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* 사용자 정보 */}
      <div className="border-t border-gray-700 p-4 bg-gray-900/30 backdrop-blur-sm">
        {session && (
          <div className="space-y-4">
            {!collapsed && (
              <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {session.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
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
              <div className="flex justify-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {session.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className={`${
                collapsed ? 'w-full h-10 p-0' : 'w-full justify-start h-10'
              } text-gray-300 hover:text-white hover:bg-red-600/20 hover:border-red-500/50 border border-transparent rounded-xl transition-all duration-200 group`}
              title={collapsed ? '로그아웃' : undefined}
            >
              <LogOut className={`h-4 w-4 ${collapsed ? '' : 'mr-2'} group-hover:text-red-400 transition-colors duration-200`} />
              {!collapsed && <span className="font-medium">로그아웃</span>}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 