'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { hasPermission, Permission } from '@/lib/auth-guards'
import { Button, type ButtonProps } from '@/components/ui/button'

interface PermissionButtonProps extends ButtonProps {
  children: ReactNode
  permission: Permission
  fallback?: ReactNode
  showWhenNoPermission?: boolean
}

export default function PermissionButton({
  children,
  permission,
  fallback = null,
  showWhenNoPermission = false,
  ...buttonProps
}: PermissionButtonProps) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return fallback
  }

  const hasAccess = hasPermission(session.user.role, permission)

  if (!hasAccess) {
    if (showWhenNoPermission) {
      return (
        <Button {...buttonProps} disabled>
          {children}
        </Button>
      )
    }
    return fallback
  }

  return <Button {...buttonProps}>{children}</Button>
}

interface MultiplePermissionButtonProps extends ButtonProps {
  children: ReactNode
  permissions: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  showWhenNoPermission?: boolean
}

export function MultiplePermissionButton({
  children,
  permissions,
  requireAll = false,
  fallback = null,
  showWhenNoPermission = false,
  ...buttonProps
}: MultiplePermissionButtonProps) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return fallback
  }

  const hasAccess = requireAll
    ? permissions.every(permission => hasPermission(session.user.role, permission))
    : permissions.some(permission => hasPermission(session.user.role, permission))

  if (!hasAccess) {
    if (showWhenNoPermission) {
      return (
        <Button {...buttonProps} disabled>
          {children}
        </Button>
      )
    }
    return fallback
  }

  return <Button {...buttonProps}>{children}</Button>
} 