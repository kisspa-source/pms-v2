'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission } from '@/lib/auth-guards'

export function usePermissions() {
  const { data: session } = useSession()

  const userRole = session?.user?.role

  const permissions = useMemo(() => {
    if (!userRole) return null

    return {
      // 단일 권한 확인
      can: (permission: Permission) => hasPermission(userRole, permission),
      
      // 여러 권한 중 하나라도 가지고 있는지 확인
      canAny: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
      
      // 모든 권한을 가지고 있는지 확인
      canAll: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
      
      // 현재 사용자 역할
      role: userRole,
      
      // 모든 권한 목록
      allPermissions: {
        canManageUsers: hasPermission(userRole, 'canManageUsers'),
        canManageOrganizations: hasPermission(userRole, 'canManageOrganizations'),
        canManageProjects: hasPermission(userRole, 'canManageProjects'),
        canManageClients: hasPermission(userRole, 'canManageClients'),
        canViewReports: hasPermission(userRole, 'canViewReports'),
        canManageRoles: hasPermission(userRole, 'canManageRoles'),
        canViewAllProjects: hasPermission(userRole, 'canViewAllProjects'),
        canManageSystemSettings: hasPermission(userRole, 'canManageSystemSettings'),
      }
    }
  }, [userRole])

  return permissions
}

// 특정 권한을 확인하는 훅
export function usePermission(permission: Permission) {
  const permissions = usePermissions()
  return permissions?.can(permission) ?? false
}

// 여러 권한 중 하나라도 가지고 있는지 확인하는 훅
export function useAnyPermission(permissionList: Permission[]) {
  const permissions = usePermissions()
  return permissions?.canAny(permissionList) ?? false
}

// 모든 권한을 가지고 있는지 확인하는 훅
export function useAllPermissions(permissionList: Permission[]) {
  const permissions = usePermissions()
  return permissions?.canAll(permissionList) ?? false
}

// 관리자 권한 확인 훅
export function useIsAdmin() {
  const permissions = usePermissions()
  return permissions?.can('canManageSystemSettings') ?? false
}

// 프로젝트 관리 권한 확인 훅
export function useCanManageProjects() {
  const permissions = usePermissions()
  return permissions?.can('canManageProjects') ?? false
}

// 사용자 관리 권한 확인 훅
export function useCanManageUsers() {
  const permissions = usePermissions()
  return permissions?.can('canManageUsers') ?? false
}

// 보고서 조회 권한 확인 훅
export function useCanViewReports() {
  const permissions = usePermissions()
  return permissions?.can('canViewReports') ?? false
} 