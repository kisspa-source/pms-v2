'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserRole } from '@/lib/auth-guards'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useAlert, useConfirm } from '@/components/ui/alert-dialog'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  organizationId: string | null
  organization: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

interface Organization {
  id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Alert/Confirm hooks
  const { showAlert, AlertComponent } = useAlert()
  const { showConfirm, ConfirmComponent } = useConfirm()

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.DEVELOPER,
    organizationId: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
    } else {
      fetchUsers()
      fetchOrganizations()
    }
  }, [session, status, router])

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      })

      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '사용자 목록을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
      showAlert(error instanceof Error ? error.message : '사용자 목록을 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('조직 목록 조회 오류:', error)
    }
  }

  const handleSearch = () => {
    fetchUsers(1)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '사용자 생성에 실패했습니다.')
      }

      showAlert('사용자가 성공적으로 생성되었습니다.', 'success')
      setShowCreateForm(false)
      setFormData({ name: '', email: '', password: '', role: UserRole.DEVELOPER, organizationId: '' })
      fetchUsers()
    } catch (error) {
      console.error('사용자 생성 오류:', error)
      showAlert(error instanceof Error ? error.message : '사용자 생성에 실패했습니다.', 'error')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser) return

    try {
      // 비밀번호가 비어있으면 제외
      const updateData = { ...formData }
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '사용자 수정에 실패했습니다.')
      }

      showAlert('사용자 정보가 성공적으로 수정되었습니다.', 'success')
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: UserRole.DEVELOPER, organizationId: '' })
      fetchUsers()
    } catch (error) {
      console.error('사용자 수정 오류:', error)
      showAlert(error instanceof Error ? error.message : '사용자 정보를 수정하는 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    showConfirm(
      '정말로 이 사용자를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      async () => {
        try {
          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '사용자 삭제에 실패했습니다.')
          }

          showAlert('사용자가 성공적으로 삭제되었습니다.', 'success')
          fetchUsers()
        } catch (error) {
          console.error('사용자 삭제 오류:', error)
          showAlert(error instanceof Error ? error.message : '사용자 삭제에 실패했습니다.', 'error')
        }
      },
      {
        type: 'error',
        title: '사용자 삭제',
        confirmText: '삭제',
        cancelText: '취소'
      }
    )
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      organizationId: user.organizationId || ''
    })
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/users/template')
      if (!response.ok) {
        throw new Error('템플릿 다운로드에 실패했습니다.')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'user_upload_template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('템플릿 다운로드 오류:', error)
      showAlert('템플릿 다운로드에 실패했습니다.', 'error')
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile) {
      showAlert('파일을 선택해주세요.', 'warning')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const response = await fetch('/api/users/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '업로드에 실패했습니다.')
      }

      showAlert(result.message, 'success')
      
      if (result.results.errors.length > 0) {
        const errorMessage = result.results.errors.slice(0, 5).join('\n')
        const remainingErrors = result.results.errors.length - 5
        showAlert(`오류 내역:\n${errorMessage}${remainingErrors > 0 ? `\n... 외 ${remainingErrors}건` : ''}`, 'warning', '업로드 결과')
      }

      setShowUploadModal(false)
      setUploadFile(null)
      fetchUsers() // 목록 새로고침
    } catch (error) {
      console.error('업로드 오류:', error)
      showAlert(error instanceof Error ? error.message : '업로드에 실패했습니다.', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <PermissionGuard permission="canManageUsers">
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">사용자 관리</h1>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 h-10 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <span className="text-sm">📊</span>
                엑셀 양식 다운로드
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 h-10 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <span className="text-sm">📊</span>
                엑셀 업로드
              </button>
              <Button onClick={() => setShowCreateForm(true)}>
                새 사용자 추가
              </Button>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>검색 및 필터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">검색</Label>
                  <Input
                    id="search"
                    placeholder="이름 또는 이메일로 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="w-48">
                  <Label htmlFor="role">역할</Label>
                  <select
                    id="role"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">모든 역할</option>
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch}>검색</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 사용자 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>사용자 목록</CardTitle>
              <CardDescription>
                총 {pagination?.total || 0}명의 사용자
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">로딩 중...</div>
              ) : users && users.length > 0 ? (
                <div className="space-y-4">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          역할: {user.role} | 
                          조직: {user.organization?.name || '없음'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(user)}>
                          수정
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  사용자가 없습니다.
                </div>
              )}

              {/* 페이지네이션 */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchUsers(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 엑셀 업로드 모달 */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>엑셀 파일 업로드</CardTitle>
                  <CardDescription>
                    엑셀 파일을 업로드하여 사용자를 일괄 등록할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="excel-file">엑셀 파일 선택</Label>
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      .xlsx 또는 .xls 파일만 업로드 가능합니다.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>업로드 전 확인사항:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                      <li>엑셀 양식을 다운로드하여 형식을 확인하세요</li>
                      <li>필수 컬럼: 이름, 이메일, 비밀번호, 역할</li>
                      <li>중복된 이메일은 업로드되지 않습니다</li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFileUpload} 
                      disabled={!uploadFile || uploading}
                      className="flex-1"
                    >
                      {uploading ? '업로드 중...' : '업로드'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowUploadModal(false)
                        setUploadFile(null)
                      }}
                      disabled={uploading}
                    >
                      취소
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 생성/수정 폼 모달 */}
          {(showCreateForm || editingUser) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>{editingUser ? '사용자 수정' : '새 사용자 추가'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                    <div>
                      <Label htmlFor="name">이름</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">
                        비밀번호 {editingUser && <span className="text-sm text-gray-500">(변경하지 않으려면 비워두세요)</span>}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                        placeholder={editingUser ? "새 비밀번호 (선택사항)" : "비밀번호"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">역할</Label>
                      <select
                        id="role"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      >
                        {Object.values(UserRole).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="organizationId">조직</Label>
                      <select
                        id="organizationId"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.organizationId}
                        onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                      >
                        <option value="">조직 없음</option>
                        {organizations.map(org => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingUser ? '수정' : '생성'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowCreateForm(false)
                          setEditingUser(null)
                          setFormData({ name: '', email: '', password: '', role: UserRole.DEVELOPER, organizationId: '' })
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alert/Confirm Components */}
          <AlertComponent />
          <ConfirmComponent />
        </div>
      </MainLayout>
    </PermissionGuard>
  )
} 