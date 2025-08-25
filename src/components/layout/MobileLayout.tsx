'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Home, 
  FolderOpen, 
  CheckSquare, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Building2,
  Building
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearchModal from '@/components/search/GlobalSearchModal';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_MENU_ITEMS, UserRole } from '@/lib/auth-guards';

interface MobileLayoutProps {
  children: React.ReactNode;
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

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { data: session, signOut } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { isSearchOpen, openSearch, closeSearch } = useGlobalSearch();

  // 사용자 역할에 따른 메뉴 가져오기
  const userRole = session?.user?.role as UserRole
  const userMenuItems = userRole ? ROLE_MENU_ITEMS[userRole] || [] : []
  
  // 메뉴 아이템을 모바일 레이아웃 형식으로 변환
  const navigation = userMenuItems.map(item => ({
    name: item.label,
    href: item.href,
    icon: iconMap[item.icon] || Home,
  }))

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 헤더 */}
      <div className="bg-white shadow-sm border-b lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">PMS System</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={openSearch}
              title="전역 검색 (Ctrl+K)"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일 사이드바 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">메뉴</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4">
              {/* 사용자 정보 */}
              <Card className="p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{session?.user?.name}</p>
                    <p className="text-sm text-gray-600">{session?.user?.email}</p>
                  </div>
                </div>
              </Card>

              {/* 네비게이션 */}
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* 로그아웃 */}
              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  로그아웃
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="lg:hidden">
        <main className="p-4">
          {children}
        </main>
      </div>

      {/* 데스크톱 레이아웃 (기존 유지) */}
      <div className="hidden lg:block">
        {children}
      </div>
      
      {/* 전역 검색 모달 */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </div>
  );
} 