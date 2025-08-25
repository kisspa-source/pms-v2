import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// 첨부파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id: projectId, attachmentId } = params

    // 첨부파일 존재 여부 및 권한 확인
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        project_id: projectId,
        user_id: session.user.id // 업로드한 사용자만 삭제 가능
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: '첨부파일을 찾을 수 없거나 삭제 권한이 없습니다.' }, { status: 404 })
    }

    // 실제 파일 삭제
    const filePath = join(process.cwd(), 'public', attachment.file_path)
    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    // 데이터베이스에서 첨부파일 정보 삭제
    await prisma.attachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({ message: '첨부파일이 삭제되었습니다.' })
  } catch (error) {
    console.error('첨부파일 삭제 실패:', error)
    return NextResponse.json({ error: '첨부파일 삭제에 실패했습니다.' }, { status: 500 })
  }
}

// 첨부파일 다운로드
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id: projectId, attachmentId } = params

    // 프로젝트 접근 권한 확인
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: session.user.id
      }
    })

    if (!projectMember) {
      return NextResponse.json({ error: '프로젝트에 대한 접근 권한이 없습니다.' }, { status: 403 })
    }

    // 첨부파일 정보 조회
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        project_id: projectId
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: '첨부파일을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 파일 경로 반환 (실제 파일 스트리밍은 Next.js static file serving 사용)
    return NextResponse.json({
      id: attachment.id,
      filename: attachment.filename,
      file_path: attachment.file_path,
      file_size: attachment.file_size.toString(),
      mime_type: attachment.mime_type,
      download_url: attachment.file_path
    })
  } catch (error) {
    console.error('첨부파일 다운로드 실패:', error)
    return NextResponse.json({ error: '첨부파일 다운로드에 실패했습니다.' }, { status: 500 })
  }
}