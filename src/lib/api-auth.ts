import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, Permission } from '@/lib/auth-guards'

// API 권한 검증 함수
export async function validateApiPermission(
  request: NextRequest,
  requiredPermission: Permission
): Promise<{ success: boolean; session?: any; error?: string; status?: number }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
        status: 401
      }
    }

    if (!hasPermission(session.user.role, requiredPermission)) {
      return {
        success: false,
        error: '권한이 없습니다.',
        status: 403
      }
    }

    return {
      success: true,
      session
    }
  } catch (error) {
    console.error('API 권한 검증 오류:', error)
    return {
      success: false,
      error: '권한 검증 중 오류가 발생했습니다.',
      status: 500
    }
  }
}

// 여러 권한 중 하나라도 가지고 있는지 검증
export async function validateAnyApiPermission(
  request: NextRequest,
  requiredPermissions: Permission[]
): Promise<{ success: boolean; session?: any; error?: string; status?: number }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
        status: 401
      }
    }

    const hasAnyPermission = requiredPermissions.some(permission => 
      hasPermission(session.user.role, permission)
    )

    if (!hasAnyPermission) {
      return {
        success: false,
        error: '권한이 없습니다.',
        status: 403
      }
    }

    return {
      success: true,
      session
    }
  } catch (error) {
    console.error('API 권한 검증 오류:', error)
    return {
      success: false,
      error: '권한 검증 중 오류가 발생했습니다.',
      status: 500
    }
  }
}

// 모든 권한을 가지고 있는지 검증
export async function validateAllApiPermissions(
  request: NextRequest,
  requiredPermissions: Permission[]
): Promise<{ success: boolean; session?: any; error?: string; status?: number }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
        status: 401
      }
    }

    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(session.user.role, permission)
    )

    if (!hasAllPermissions) {
      return {
        success: false,
        error: '권한이 없습니다.',
        status: 403
      }
    }

    return {
      success: true,
      session
    }
  } catch (error) {
    console.error('API 권한 검증 오류:', error)
    return {
      success: false,
      error: '권한 검증 중 오류가 발생했습니다.',
      status: 500
    }
  }
}

// API 응답 헬퍼 함수
export function createApiResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function createApiErrorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({ error }, { status })
}

// API 권한 검증 래퍼 함수
export function withApiPermission(requiredPermission: Permission) {
  return async (request: NextRequest) => {
    const validation = await validateApiPermission(request, requiredPermission)
    
    if (!validation.success) {
      return createApiErrorResponse(validation.error!, validation.status!)
    }
    
    return validation.session
  }
}

export function withAnyApiPermission(requiredPermissions: Permission[]) {
  return async (request: NextRequest) => {
    const validation = await validateAnyApiPermission(request, requiredPermissions)
    
    if (!validation.success) {
      return createApiErrorResponse(validation.error!, validation.status!)
    }
    
    return validation.session
  }
}

export function withAllApiPermissions(requiredPermissions: Permission[]) {
  return async (request: NextRequest) => {
    const validation = await validateAllApiPermissions(request, requiredPermissions)
    
    if (!validation.success) {
      return createApiErrorResponse(validation.error!, validation.status!)
    }
    
    return validation.session
  }
} 