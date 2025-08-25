// Role enum 직접 정의 (Prisma import 문제 해결)
export enum UserRole {
  PMO = 'PMO',
  PM = 'PM',
  PL = 'PL',
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  CONSULTANT = 'CONSULTANT',
}

// 역할별 권한 매트릭스 정의
export const ROLE_PERMISSIONS = {
  [UserRole.PMO]: {
    canManageUsers: true,
    canManageOrganizations: true,
    canManageProjects: true,
    canManageClients: true,
    canViewReports: true,
    canManageRoles: true,
    canViewAllProjects: true,
    canManageSystemSettings: true,
    canViewClients: true,
    canViewOrganizations: true,
  },
  [UserRole.PM]: {
    canManageUsers: false,
    canManageOrganizations: false,
    canManageProjects: true,
    canManageClients: true,
    canViewReports: true,
    canManageRoles: false,
    canViewAllProjects: true,
    canManageSystemSettings: false,
    canViewClients: true,
    canViewOrganizations: true,
  },
  [UserRole.PL]: {
    canManageUsers: false,
    canManageOrganizations: false,
    canManageProjects: false,
    canManageClients: false,
    canViewReports: false,
    canManageRoles: false,
    canViewAllProjects: false,
    canManageSystemSettings: false,
    canViewClients: true,
    canViewOrganizations: true,
  },
  [UserRole.DEVELOPER]: {
    canManageUsers: false,
    canManageOrganizations: false,
    canManageProjects: false,
    canManageClients: false,
    canViewReports: false,
    canManageRoles: false,
    canViewAllProjects: false,
    canManageSystemSettings: false,
    canViewClients: true,
    canViewOrganizations: true,
  },
  [UserRole.DESIGNER]: {
    canManageUsers: false,
    canManageOrganizations: false,
    canManageProjects: false,
    canManageClients: false,
    canViewReports: false,
    canManageRoles: false,
    canViewAllProjects: false,
    canManageSystemSettings: false,
    canViewClients: true,
    canViewOrganizations: true,
  },
  [UserRole.CONSULTANT]: {
    canManageUsers: false,
    canManageOrganizations: false,
    canManageProjects: false,
    canManageClients: false,
    canViewReports: false,
    canManageRoles: false,
    canViewAllProjects: false,
    canManageSystemSettings: false,
    canViewClients: true,
    canViewOrganizations: true,
  },
} as const

// 권한 타입 정의
export type Permission = keyof typeof ROLE_PERMISSIONS[UserRole]

// 사용자의 특정 권한 확인
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.[permission] ?? false
}

// 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// 사용자가 모든 권한을 가지고 있는지 확인
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// 역할별 접근 가능한 라우트 정의
export const ROLE_ROUTES = {
  [UserRole.PMO]: [
    '/dashboard',
    '/users',
    '/organizations',
    '/projects',
    '/tasks',
    '/clients',
    '/reports',
    '/settings',
  ],
  [UserRole.PM]: [
    '/dashboard',
    '/projects',
    '/tasks',
    '/clients',
    '/reports',
    '/settings',
  ],
  [UserRole.PL]: [
    '/dashboard',
    '/projects',
    '/tasks',
    '/settings',
  ],
  [UserRole.DEVELOPER]: [
    '/dashboard',
    '/projects',
    '/tasks',
    '/settings',
  ],
  [UserRole.DESIGNER]: [
    '/dashboard',
    '/projects',
    '/tasks',
    '/settings',
  ],
  [UserRole.CONSULTANT]: [
    '/dashboard',
    '/projects',
    '/tasks',
    '/settings',
  ],
} as const

// 사용자가 특정 라우트에 접근할 수 있는지 확인
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const allowedRoutes = ROLE_ROUTES[userRole] || []
  
  // 정확한 매칭을 위해 경로를 정규화
  const normalizedRoute = route.endsWith('/') ? route.slice(0, -1) : route
  
  return allowedRoutes.some(allowedRoute => {
    const normalizedAllowedRoute = allowedRoute.endsWith('/') ? allowedRoute.slice(0, -1) : allowedRoute
    return normalizedRoute === normalizedAllowedRoute || normalizedRoute.startsWith(normalizedAllowedRoute + '/')
  })
}

// 역할별 대시보드 리다이렉트 경로
export function getDashboardRedirectPath(userRole: UserRole): string {
  switch (userRole) {
    case UserRole.PMO:
      return '/dashboard'
    case UserRole.PM:
      return '/dashboard'
    case UserRole.PL:
      return '/dashboard'
    case UserRole.DEVELOPER:
      return '/dashboard'
    case UserRole.DESIGNER:
      return '/dashboard'
    case UserRole.CONSULTANT:
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

// 역할별 메뉴 아이템 정의
export const ROLE_MENU_ITEMS = {
  [UserRole.PMO]: [
    { label: '대시보드', href: '/dashboard', icon: 'dashboard' },
    { label: '사용자 관리', href: '/users', icon: 'users' },
    { label: '조직 관리', href: '/organizations', icon: 'organization' },
    { label: '프로젝트 관리', href: '/projects', icon: 'project' },
    { label: '작업 관리', href: '/tasks', icon: 'task' },
    { label: '고객사 관리', href: '/clients', icon: 'client' },
    { label: '보고서', href: '/reports', icon: 'report' },
    { label: '설정', href: '/settings', icon: 'settings' },
  ],
  [UserRole.PM]: [
    { label: '대시보드', href: '/dashboard', icon: 'dashboard' },
    { label: '프로젝트 관리', href: '/projects', icon: 'project' },
    { label: '작업 관리', href: '/tasks', icon: 'task' },
    { label: '고객사 관리', href: '/clients', icon: 'client' },
    { label: '보고서', href: '/reports', icon: 'report' },
    { label: '설정', href: '/settings', icon: 'settings' },
  ],
  [UserRole.PL]: [
    { label: '대시보드', href: '/dashboard', icon: 'dashboard' },
    { label: '프로젝트', href: '/projects', icon: 'project' },
    { label: '작업', href: '/tasks', icon: 'task' },
    { label: '설정', href: '/settings', icon: 'settings' },
  ],
  [UserRole.DEVELOPER]: [
    { label: '대시보드', href: '/dashboard', icon: 'dashboard' },
    { label: '프로젝트', href: '/projects', icon: 'project' },
    { label: '작업', href: '/tasks', icon: 'task' },
    { label: '설정', href: '/settings', icon: 'settings' },
  ],
  [UserRole.DESIGNER]: [
    { label: '대시보드', href: '/dashboard', icon: 'dashboard' },
    { label: '프로젝트', href: '/projects', icon: 'project' },
    { label: '작업', href: '/tasks', icon: 'task' },
    { label: '설정', href: '/settings', icon: 'settings' },
  ],
  [UserRole.CONSULTANT]: [
    { label: '대시보드', href: '/dashboard', icon: 'dashboard' },
    { label: '프로젝트', href: '/projects', icon: 'project' },
    { label: '작업', href: '/tasks', icon: 'task' },
    { label: '설정', href: '/settings', icon: 'settings' },
  ],
} as const

// 사용자 역할에 따른 메뉴 아이템 반환
export function getMenuItems(userRole: UserRole) {
  return ROLE_MENU_ITEMS[userRole] || ROLE_MENU_ITEMS[UserRole.DEVELOPER]
} 