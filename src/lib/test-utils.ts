// 테스트 유틸리티 함수들

export const testApiEndpoint = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    })
    
    const data = await response.json()
    
    return {
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : data.error
    }
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const createTestComment = async (projectId: string, content: string) => {
  return testApiEndpoint(`/api/projects/${projectId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  })
}

export const getTestComments = async (projectId: string) => {
  return testApiEndpoint(`/api/projects/${projectId}/comments`)
}

export const createTestFile = (filename: string, content: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  return new File([blob], filename, { type: mimeType })
}

export const uploadTestFile = async (projectId: string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return fetch(`/api/projects/${projectId}/attachments`, {
    method: 'POST',
    body: formData
  })
}

// 테스트 데이터 생성
export const generateTestData = {
  comment: (index: number = 1) => ({
    content: `테스트 댓글 ${index} - ${new Date().toISOString()}`
  }),
  
  file: (index: number = 1) => createTestFile(
    `test-file-${index}.txt`,
    `테스트 파일 내용 ${index}\n생성 시간: ${new Date().toISOString()}`,
    'text/plain'
  ),
  
  imageFile: (index: number = 1) => {
    // 1x1 픽셀 투명 PNG 생성
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0)'
      ctx.fillRect(0, 0, 1, 1)
    }
    
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], `test-image-${index}.png`, { type: 'image/png' }))
        }
      }, 'image/png')
    })
  }
}

// 테스트 시나리오 실행
export const runBasicTests = async (projectId: string) => {
  console.log('🧪 기본 테스트 시작...')
  
  const results = {
    comments: {
      get: false,
      post: false
    },
    attachments: {
      get: false,
      post: false
    }
  }
  
  try {
    // 댓글 조회 테스트
    console.log('📝 댓글 조회 테스트...')
    const commentsResult = await getTestComments(projectId)
    results.comments.get = commentsResult.success
    console.log('댓글 조회:', commentsResult.success ? '✅' : '❌', commentsResult.error || '')
    
    // 댓글 작성 테스트
    console.log('📝 댓글 작성 테스트...')
    const commentData = generateTestData.comment()
    const createCommentResult = await createTestComment(projectId, commentData.content)
    results.comments.post = createCommentResult.success
    console.log('댓글 작성:', createCommentResult.success ? '✅' : '❌', createCommentResult.error || '')
    
    // 첨부파일 조회 테스트
    console.log('📎 첨부파일 조회 테스트...')
    const attachmentsResult = await testApiEndpoint(`/api/projects/${projectId}/attachments`)
    results.attachments.get = attachmentsResult.success
    console.log('첨부파일 조회:', attachmentsResult.success ? '✅' : '❌', attachmentsResult.error || '')
    
    // 첨부파일 업로드 테스트
    console.log('📎 첨부파일 업로드 테스트...')
    const testFile = generateTestData.file()
    const uploadResult = await uploadTestFile(projectId, testFile)
    const uploadSuccess = uploadResult.ok
    results.attachments.post = uploadSuccess
    console.log('첨부파일 업로드:', uploadSuccess ? '✅' : '❌')
    
  } catch (error) {
    console.error('테스트 실행 중 오류:', error)
  }
  
  console.log('🧪 테스트 완료')
  console.table(results)
  
  return results
}