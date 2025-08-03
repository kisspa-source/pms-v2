'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Attachment {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AttachmentListProps {
  projectId?: string;
  taskId?: string;
  onDelete?: (attachmentId: string) => void;
}

export default function AttachmentList({ projectId, taskId, onDelete }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  // 첨부파일 목록 조회
  const fetchAttachments = async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (taskId) params.append('taskId', taskId);

      const response = await fetch(`/api/attachments?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error('첨부파일 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [projectId, taskId]);

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId));
        onDelete?.(attachmentId);
      } else {
        const error = await response.json();
        alert(error.error || '파일 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType === 'text/plain') return '📄';
    if (mimeType === 'text/csv') return '📊';
    return '📎';
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.file_path;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (attachment: Attachment) => {
    if (attachment.mime_type.startsWith('image/')) {
      // 이미지는 새 창에서 열기
      window.open(attachment.file_path, '_blank');
    } else if (attachment.mime_type === 'application/pdf') {
      // PDF는 새 창에서 열기
      window.open(attachment.file_path, '_blank');
    } else {
      // 기타 파일은 다운로드
      handleDownload(attachment);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">로딩 중...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">첨부파일 ({attachments.length})</h3>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          첨부된 파일이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getFileIcon(attachment.mime_type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{attachment.filename}</div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(attachment.file_size)} • {attachment.user.name} • {formatDate(attachment.created_at)}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(attachment)}
                >
                  {attachment.mime_type.startsWith('image/') || attachment.mime_type === 'application/pdf' ? '보기' : '다운로드'}
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(attachment.id)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
} 