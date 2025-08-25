'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Paperclip,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Archive
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  getErrorMessage, 
  formatFileSize as formatSize,
  validateFileType,
  validateFileSize
} from '@/lib/error-messages'

interface Attachment {
  id: string
  filename: string
  file_path: string
  file_size: string
  mime_type: string
  created_at: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface AttachmentSectionProps {
  projectId: string
}

export function AttachmentSection({ projectId }: AttachmentSectionProps) {
  const { data: session } = useSession()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 첨부파일 목록 로드
  const loadAttachments = async () => {
    try {
      console.log('첨부파일 로드 시작:', `/api/projects/${projectId}/attachments`)
      const response = await fetch(`/api/projects/${projectId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      } else {
        const error = await response.json().catch(() => ({ error: '응답 파싱 실패' }))
        console.error('첨부파일 로드 API 오류:', {
          status: response.status,
          statusText: response.statusText,
          error
        })
        toast.error(`API 오류 (${response.status}): ${error.error || '첨부파일을 불러오는데 실패했습니다.'}`)
      }
    } catch (error) {
      console.error('첨부파일 로드 실패:', error)
      toast.error(`첨부파일을 불러오는데 실패했습니다: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttachments()
  }, [projectId])

  // 파일 업로드
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return

    const file = files[0]
    
    // 파일 크기 검증
    const sizeValidation = validateFileSize(file.size)
    if (!sizeValidation.isValid) {
      toast.error(sizeValidation.message!)
      return
    }

    // 파일 타입 검증
    const typeValidation = validateFileType(file.name)
    if (!typeValidation.isValid) {
      toast.error(typeValidation.message!)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // 업로드 진행률 시뮬레이션 (실제 진행률은 서버에서 구현 필요)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`/api/projects/${projectId}/attachments`, {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const attachment = await response.json()
        setAttachments(prev => [attachment, ...prev])
        toast.success(SUCCESS_MESSAGES.FILE_UPLOADED)
        
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const error = await response.json()
        toast.error(error.error || '파일 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      toast.error('파일 업로드에 실패했습니다.')
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  // 파일 삭제
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('첨부파일을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId))
        toast.success('첨부파일이 삭제되었습니다.')
      } else {
        const error = await response.json()
        toast.error(error.error || '첨부파일 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('첨부파일 삭제 실패:', error)
      toast.error('첨부파일 삭제에 실패했습니다.')
    }
  }

  // 파일 다운로드
  const handleDownloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a')
    link.href = attachment.file_path
    link.download = attachment.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 파일 크기 포맷팅 (유틸리티 함수 사용)
  const formatFileSize = (bytes: string) => formatSize(parseInt(bytes))

  // 파일 아이콘 가져오기
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType.startsWith('audio/')) return FileAudio
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return Archive
    if (mimeType.includes('text') || mimeType.includes('document')) return FileText
    return File
  }

  // 파일 미리보기 가능 여부 확인
  const isPreviewable = (mimeType: string) => {
    return mimeType.startsWith('image/') || 
           mimeType === 'application/pdf' ||
           mimeType.startsWith('text/')
  }

  // 파일 미리보기
  const handlePreviewFile = (attachment: Attachment) => {
    if (isPreviewable(attachment.mime_type)) {
      window.open(attachment.file_path, '_blank')
    } else {
      handleDownloadAttachment(attachment)
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">첨부파일을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 파일 업로드 영역 */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <div
            className="text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">파일 업로드</h4>
            <p className="text-gray-600 text-sm mb-4">
              파일을 드래그하여 놓거나 클릭하여 선택하세요 (최대 10MB)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              accept="*/*"
              aria-label="파일 선택"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mb-4"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              파일 선택
            </Button>
            
            {uploading && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600 mt-2">업로드 중...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 첨부파일 목록 */}
      <div className="space-y-4">
        {attachments.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-800 mb-2">첨부파일이 없습니다</h4>
              <p className="text-gray-600 text-sm">첫 번째 파일을 업로드해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.mime_type)
            
            return (
              <Card key={attachment.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {attachment.filename}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(attachment.file_size)}</span>
                        <span>•</span>
                        <span>{attachment.user.name}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(attachment.created_at), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isPreviewable(attachment.mime_type) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewFile(attachment)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          미리보기
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadAttachment(attachment)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        다운로드
                      </Button>
                      
                      {attachment.user.id === session?.user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      
      {/* 첨부파일 통계 */}
      {attachments.length > 0 && (
        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>총 {attachments.length}개의 파일</span>
              <span>
                전체 크기: {formatFileSize(
                  attachments.reduce((total, att) => total + parseInt(att.file_size), 0).toString()
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}