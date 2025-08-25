import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력해주세요.'),
  parent_comment_id: z.string().optional()
})

// 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('댓글 API GET 요청:', params.id)
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

    const comments = await prisma.comment.findMany({
      where: {
        project_id: projectId,
        parent_comment_id: null // 최상위 댓글만 조회
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true
              }
            }
          },
          orderBy: {
            created_at: 'asc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('댓글 조회 실패:', error)
    return NextResponse.json({ 
      error: '댓글을 불러오는데 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// 댓글 작성
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
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // 프로젝트 존재 여부 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 부모 댓글이 있는 경우 존재 여부 확인
    if (validatedData.parent_comment_id) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: validatedData.parent_comment_id,
          project_id: projectId
        }
      })

      if (!parentComment) {
        return NextResponse.json({ error: '부모 댓글을 찾을 수 없습니다.' }, { status: 404 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        project_id: projectId,
        user_id: session.user.id,
        content: validatedData.content,
        parent_comment_id: validatedData.parent_comment_id
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

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('댓글 작성 실패:', error)
    return NextResponse.json({ error: '댓글 작성에 실패했습니다.' }, { status: 500 })
  }
}