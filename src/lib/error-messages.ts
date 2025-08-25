// 에러 메시지 상수 정의

export const ERROR_MESSAGES = {
  // 인증 관련
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  
  // 댓글 관련
  COMMENT_NOT_FOUND: '댓글을 찾을 수 없습니다.',
  COMMENT_EMPTY: '댓글 내용을 입력해주세요.',
  COMMENT_CREATE_FAILED: '댓글 작성에 실패했습니다.',
  COMMENT_UPDATE_FAILED: '댓글 수정에 실패했습니다.',
  COMMENT_DELETE_FAILED: '댓글 삭제에 실패했습니다.',
  COMMENT_LOAD_FAILED: '댓글을 불러오는데 실패했습니다.',
  
  // 첨부파일 관련
  FILE_NOT_SELECTED: '파일을 선택해주세요.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다. (최대 10MB)',
  FILE_TYPE_NOT_ALLOWED: '허용되지 않는 파일 형식입니다.',
  FILE_UPLOAD_FAILED: '파일 업로드에 실패했습니다.',
  FILE_DELETE_FAILED: '파일 삭제에 실패했습니다.',
  FILE_DOWNLOAD_FAILED: '파일 다운로드에 실패했습니다.',
  FILE_LOAD_FAILED: '파일 목록을 불러오는데 실패했습니다.',
  
  // 프로젝트 관련
  PROJECT_NOT_FOUND: '프로젝트를 찾을 수 없습니다.',
  PROJECT_ACCESS_DENIED: '프로젝트에 대한 접근 권한이 없습니다.',
  
  // 일반적인 에러
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
} as const

export const SUCCESS_MESSAGES = {
  // 댓글 관련
  COMMENT_CREATED: '댓글이 작성되었습니다.',
  COMMENT_UPDATED: '댓글이 수정되었습니다.',
  COMMENT_DELETED: '댓글이 삭제되었습니다.',
  REPLY_CREATED: '답글이 작성되었습니다.',
  
  // 첨부파일 관련
  FILE_UPLOADED: '파일이 업로드되었습니다.',
  FILE_DELETED: '파일이 삭제되었습니다.'
} as const

// 에러 타입별 사용자 친화적 메시지 변환
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error
  }
  
  if (error?.message) {
    return error.message
  }
  
  if (error?.error) {
    return error.error
  }
  
  // HTTP 상태 코드별 메시지
  if (error?.status) {
    switch (error.status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED
      case 403:
        return ERROR_MESSAGES.FORBIDDEN
      case 404:
        return ERROR_MESSAGES.PROJECT_NOT_FOUND
      case 413:
        return ERROR_MESSAGES.FILE_TOO_LARGE
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR
}

// 파일 크기 포맷팅
export const formatFileSize = (bytes: number | string): string => {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (size === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(size) / Math.log(k))
  
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 파일 타입 검증
export const validateFileType = (filename: string): { isValid: boolean; message?: string } => {
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar']
  const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  
  if (dangerousExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.FILE_TYPE_NOT_ALLOWED
    }
  }
  
  return { isValid: true }
}

// 파일 크기 검증
export const validateFileSize = (size: number, maxSize: number = 10 * 1024 * 1024): { isValid: boolean; message?: string } => {
  if (size > maxSize) {
    return {
      isValid: false,
      message: `${ERROR_MESSAGES.FILE_TOO_LARGE} (${formatFileSize(maxSize)})`
    }
  }
  
  return { isValid: true }
}