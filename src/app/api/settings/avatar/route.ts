import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// 프로필 사진 업로드
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '파일이 선택되지 않았습니다.' }, { status: 400 })
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기는 5MB를 초과할 수 없습니다.' }, { status: 400 })
    }

    // 이미지 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP만 지원)' }, { status: 400 })
    }

    // 현재 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, avatar_url: true }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 아바타 저장 디렉토리 생성
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 기존 아바타 파일 삭제
    if (user.avatar_url && user.avatar_url.startsWith('/uploads/avatars/')) {
      const oldFilePath = join(process.cwd(), 'public', user.avatar_url)
      try {
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath)
        }
      } catch (error) {
        console.warn('기존 아바타 파일 삭제 실패:', error)
      }
    }

    // 새 파일명 생성
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${user.id}_${timestamp}.${extension}`
    const filePath = join(uploadDir, fileName)
    const avatarUrl = `/uploads/avatars/${fileName}`

    // 파일 저장
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 데이터베이스 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar_url: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true
      }
    })

    return NextResponse.json({
      message: '프로필 사진이 성공적으로 업데이트되었습니다.',
      avatar_url: avatarUrl,
      user: updatedUser
    })

  } catch (error) {
    console.error('프로필 사진 업로드 오류:', error)
    return NextResponse.json(
      { error: '프로필 사진 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 프로필 사진 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 현재 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, avatar_url: true }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 기존 아바타 파일 삭제
    if (user.avatar_url && user.avatar_url.startsWith('/uploads/avatars/')) {
      const filePath = join(process.cwd(), 'public', user.avatar_url)
      try {
        if (existsSync(filePath)) {
          await unlink(filePath)
        }
      } catch (error) {
        console.warn('아바타 파일 삭제 실패:', error)
      }
    }

    // 데이터베이스에서 avatar_url 제거
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar_url: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true
      }
    })

    return NextResponse.json({
      message: '프로필 사진이 성공적으로 삭제되었습니다.',
      user: updatedUser
    })

  } catch (error) {
    console.error('프로필 사진 삭제 오류:', error)
    return NextResponse.json(
      { error: '프로필 사진 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}