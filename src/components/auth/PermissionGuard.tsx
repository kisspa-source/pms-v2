'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { hasPermission, Permission } from '@/lib/auth-guards'

interface PermissionGuardProps {
  children: ReactNode
  permission: Permission
  fallback?: ReactNode
}

export default function PermissionGuard({ 
  children, 
  permission, 
  fallback = null 
}: PermissionGuardProps) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return fallback
  }

  const hasAccess = hasPermission(session.user.role, permission)

  if (!hasAccess) {
    return fallback
  }

  return <>{children}</>
}

interface MultiplePermissionGuardProps {
  children: ReactNode
  permissions: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function MultiplePermissionGuard({ 
  children, 
  permissions, 
  requireAll = false,
  fallback = null 
}: MultiplePermissionGuardProps) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return fallback
  }

  const hasAccess = requireAll 
    ? permissions.every(permission => hasPermission(session.user.role, permission))
    : permissions.some(permission => hasPermission(session.user.role, permission))

  if (!hasAccess) {
    return fallback
  }

  return <>{children}</>
} 