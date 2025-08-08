'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useAlert, useConfirm } from '@/components/ui/alert-dialog';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  replies: Comment[];
}

interface CommentSectionProps {
  projectId?: string;
  taskId?: string;
}

export default function CommentSection({ projectId, taskId }: CommentSectionProps) {
  const { data: session } = useSession();
  const { createComment } = useSocket();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { showAlert, AlertComponent } = useAlert();
  const { showConfirm, ConfirmComponent } = useConfirm();

  // 댓글 목록 조회
  const fetchComments = async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (taskId) params.append('taskId', taskId);

      const response = await fetch(`/api/comments?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('댓글 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [projectId, taskId]);

  // 실시간 댓글 수신
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    const handleNewComment = (commentData: any) => {
      if (commentData.taskId === taskId) {
        // 새 댓글을 댓글 목록에 추가
        const newComment: Comment = {
          id: commentData.id,
          content: commentData.content,
          created_at: commentData.createdAt,
          updated_at: commentData.createdAt,
          user: {
            id: commentData.userId,
            name: commentData.userName,
            email: '',
          },
          replies: [],
        };
        setComments(prev => [newComment, ...prev]);
      }
    };

    socket.on('comment:new', handleNewComment);

    return () => {
      socket.off('comment:new', handleNewComment);
    };
  }, [taskId]);

  // 댓글 작성
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // 실시간 댓글 전송
      if (taskId) {
        createComment(newComment.trim(), taskId);
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          taskId,
          content: newComment.trim()
        }),
      });

      if (response.ok) {
        setNewComment('');
        // 실시간으로 이미 추가되었으므로 다시 조회하지 않음
      } else {
        const error = await response.json();
        showAlert(error.error || '댓글 작성에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      showAlert('댓글 작성 중 오류가 발생했습니다.', 'error');
    }
  };

  // 답글 작성
  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          taskId,
          content: replyContent.trim(),
          parentCommentId
        }),
      });

      if (response.ok) {
        setReplyContent('');
        setReplyTo(null);
        fetchComments();
      } else {
        const error = await response.json();
        showAlert(error.error || '답글 작성에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('답글 작성 오류:', error);
      showAlert('답글 작성 중 오류가 발생했습니다.', 'error');
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim()
        }),
      });

      if (response.ok) {
        setEditContent('');
        setEditingComment(null);
        fetchComments();
      } else {
        const error = await response.json();
        showAlert(error.error || '댓글 수정에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      showAlert('댓글 수정 중 오류가 발생했습니다.', 'error');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    showConfirm(
      '정말로 이 댓글을 삭제하시겠습니까?',
      async () => {

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchComments();
      } else {
        const error = await response.json();
        showAlert(error.error || '댓글 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      showAlert('댓글 삭제 중 오류가 발생했습니다.', 'error');
    }
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const canEditComment = (comment: Comment) => {
    return session?.user?.email === comment.user.email;
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start space-x-3 mb-2">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
          {comment.user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{comment.user.name}</span>
            <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
          </div>
          
          {editingComment === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={input()}
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                  저장
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}>
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              
              {!isReply && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplyTo(comment.id)}
                  >
                    답글
                  </Button>
                  {canEditComment(comment) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 답글 입력 폼 */}
          {replyTo === comment.id && !isReply && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className={input()}
                rows={2}
                placeholder="답글을 입력하세요..."
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>
                  답글 작성
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setReplyTo(null);
                  setReplyContent('');
                }}>
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 답글들 렌더링 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">로딩 중...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">댓글 ({comments.length})</h3>
      
      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className={input()}
          rows={3}
          placeholder="댓글을 입력하세요..."
        />
        <div className="flex justify-end mt-2">
          <Button type="submit" disabled={!newComment.trim()}>
            댓글 작성
          </Button>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 댓글이 없습니다.
          </div>
        ) : (
          comments.map(renderComment)
        )}
      </div>
    </Card>
    
    <AlertComponent />
    <ConfirmComponent />
  );
} 