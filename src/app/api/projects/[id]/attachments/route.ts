import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// 첨부파일 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('첨부파일 API GET 요청:', params.id)
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const projectId = params.id

    // 프로젝트 존재 여부 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // TODO: 프로젝트 접근 권한 확인 (임시로 비활성화)
    // const projectMember = await prisma.projectMember.findFirst({
    //   where: {
    //     project_id: projectId,
    //     user_id: session.user.id
    //   }
    // })

    // if (!projectMember) {
    //   return NextResponse.json({ error: '프로젝트에 대한 접근 권한이 없습니다.' }, { status: 403 })
    // }

    const attachments = await prisma.attachment.findMany({
      where: {
        project_id: projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // BigInt를 문자열로 변환
    const attachmentsResponse = attachments.map(attachment => ({
      ...attachment,
      file_size: attachment.file_size?.toString() || '0'
    }))

    return NextResponse.json(attachmentsResponse)
  } catch (error) {
    console.error('첨부파일 조회 실패:', error)
    return NextResponse.json({ 
      error: '첨부파일을 불러오는데 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// 첨부파일 업로드
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const projectId = params.id

    // 프로젝트 존재 여부 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // TODO: 프로젝트 접근 권한 확인 (임시로 비활성화)
    // const projectMember = await prisma.projectMember.findFirst({
    //   where: {
    //     project_id: projectId,
    //     user_id: session.user.id
    //   }
    // })

    // if (!projectMember) {
    //   return NextResponse.json({ error: '프로젝트에 대한 접근 권한이 없습니다.' }, { status: 403 })
    // }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 선택되지 않았습니다.' }, { status: 400 })
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 })
    }

    // 허용되지 않는 파일 확장자 체크
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (dangerousExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: '보안상 허용되지 않는 파일 형식입니다.' }, { status: 400 })
    }

    // 업로드 디렉토리 생성
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now()
    const originalName = file.name
    const extension = originalName.split('.').pop()
    const filename = `${timestamp}_${originalName}`
    const filePath = join(uploadDir, filename)
    const relativePath = `/uploads/projects/${projectId}/${filename}`

    // 파일 저장
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 데이터베이스에 첨부파일 정보 저장
    const attachment = await prisma.attachment.create({
      data: {
        project_id: projectId,
        user_id: session.user.id,
        filename: originalName,
        file_path: relativePath,
        file_size: BigInt(file.size),
        mime_type: file.type
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // BigInt를 문자열로 변환
    const attachmentResponse = {
      ...attachment,
      file_size: attachment.file_size.toString()
    }

    return NextResponse.json(attachmentResponse, { status: 201 })
  } catch (error) {
    console.error('첨부파일 업로드 실패:', error)
    return NextResponse.json({ error: '첨부파일 업로드에 실패했습니다.' }, { status: 500 })
  }
}