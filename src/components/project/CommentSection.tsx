'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Reply, Edit, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ERROR_MESSAGES, SUCCESS_MESSAGES, getErrorMessage } from '@/lib/error-messages'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  replies?: Comment[]
}

interface CommentSectionProps {
  projectId: string
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 댓글 목록 로드
  const loadComments = async () => {
    try {
      console.log('댓글 로드 시작:', `/api/projects/${projectId}/comments`)
      const response = await fetch(`/api/projects/${projectId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      } else {
        const error = await response.json().catch(() => ({ error: '응답 파싱 실패' }))
        console.error('댓글 로드 API 오류:', {
          status: response.status,
          statusText: response.statusText,
          error
        })
        toast.error(`API 오류 (${response.status}): ${error.error || '댓글을 불러오는데 실패했습니다.'}`)
      }
    } catch (error) {
      console.error('댓글 로드 실패:', error)
      toast.error(`댓글을 불러오는데 실패했습니다: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [projectId])

  // 새 댓글 작성
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => [comment, ...prev])
        setNewComment('')
        toast.success(SUCCESS_MESSAGES.COMMENT_CREATED)
      } else {
        const error = await response.json()
        toast.error(error.error || '댓글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      toast.error('댓글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 답글 작성
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyContent,
          parent_comment_id: parentId
        })
      })

      if (response.ok) {
        const reply = await response.json()
        setComments(prev => prev.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: [...(comment.replies || []), reply] }
            : comment
        ))
        setReplyContent('')
        setReplyingTo(null)
        toast.success('답글이 작성되었습니다.')
      } else {
        const error = await response.json()
        toast.error(error.error || '답글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('답글 작성 실패:', error)
      toast.error('답글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 댓글 수정
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })

      if (response.ok) {
        const updatedComment = await response.json()
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? updatedComment : {
            ...comment,
            replies: comment.replies?.map(reply => 
              reply.id === commentId ? updatedComment : reply
            )
          }
        ))
        setEditingComment(null)
        setEditContent('')
        toast.success('댓글이 수정되었습니다.')
      } else {
        const error = await response.json()
        toast.error(error.error || '댓글 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 수정 실패:', error)
      toast.error('댓글 수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId)
          .map(comment => ({
            ...comment,
            replies: comment.replies?.filter(reply => reply.id !== commentId)
          })))
        toast.success('댓글이 삭제되었습니다.')
      } else {
        const error = await response.json()
        toast.error(error.error || '댓글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      toast.error('댓글 삭제에 실패했습니다.')
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12 mt-3' : 'mb-4'}`}>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user.avatar_url || undefined} />
              <AvatarFallback className="bg-gray-500 text-white">
                {comment.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{comment.user.name}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { 
                    addSuffix: true, 
                    locale: ko 
                  })}
                </span>
                {comment.created_at !== comment.updated_at && (
                  <span className="text-xs text-gray-400">(수정됨)</span>
                )}
              </div>
              
              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="댓글을 수정하세요..."
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleEditComment(comment.id)}
                      disabled={submitting}
                    >
                      저장
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingComment(null)
                        setEditContent('')
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    {!isReply && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplyingTo(comment.id)
                          setReplyContent('')
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        답글
                      </Button>
                    )}
                    
                    {comment.user.id === session?.user?.id && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingComment(comment.id)
                            setEditContent(comment.content)
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          삭제
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* 답글 작성 폼 */}
          {replyingTo === comment.id && (
            <div className="mt-4 ml-11">
              <div className="space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      handleSubmitReply(comment.id)
                    }
                  }}
                  placeholder="답글을 작성하세요... (Ctrl+Enter로 전송)"
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    답글 작성
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 답글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">댓글을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 새 댓글 작성 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-blue-500 text-white">
                {session?.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
                placeholder="댓글을 작성하세요... (Ctrl+Enter로 전송)"
                className="min-h-[100px]"
                aria-label="새 댓글 작성"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  댓글 작성
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-800 mb-2">아직 댓글이 없습니다</h4>
              <p className="text-gray-600 text-sm">첫 번째 댓글을 작성해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}