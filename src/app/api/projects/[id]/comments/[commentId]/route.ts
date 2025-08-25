import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력해주세요.')
})

// 댓글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id: projectId, commentId } = params
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // 댓글 존재 여부 및 권한 확인
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        project_id: projectId,
        user_id: session.user.id // 작성자만 수정 가능
      }
    })

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없거나 수정 권한이 없습니다.' }, { status: 404 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        updated_at: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        }
      }
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('댓글 수정 실패:', error)
    return NextResponse.json({ error: '댓글 수정에 실패했습니다.' }, { status: 500 })
  }
}

// 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id: projectId, commentId } = params

    // 댓글 존재 여부 및 권한 확인
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        project_id: projectId,
        user_id: session.user.id // 작성자만 삭제 가능
      }
    })

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.' }, { status: 404 })
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ message: '댓글이 삭제되었습니다.' })
  } catch (error) {
    console.error('댓글 삭제 실패:', error)
    return NextResponse.json({ error: '댓글 삭제에 실패했습니다.' }, { status: 500 })
  }
}