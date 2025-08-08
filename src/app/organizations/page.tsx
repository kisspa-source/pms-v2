'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useAlert, useConfirm } from '@/components/ui/alert-dialog'

interface Organization {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  createdAt: string
  updatedAt: string
  _count: {
    users: number
    projects: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function OrganizationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const { showAlert, AlertComponent } = useAlert()
  const { showConfirm, ConfirmComponent } = useConfirm()

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
    } else {
      fetchOrganizations()
    }
  }, [session, status, router])

  const fetchOrganizations = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/organizations?${params}`)
      if (!response.ok) throw new Error('조직 목록을 불러오는데 실패했습니다.')

      const data = await response.json()
      setOrganizations(data.organizations)
      setPagination(data.pagination)
    } catch (error) {
      console.error('조직 목록 조회 오류:', error)
      showAlert('조직 목록을 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchOrganizations(1)
  }

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '조직 생성에 실패했습니다.')
      }

      showAlert('조직이 성공적으로 생성되었습니다.', 'success')
      setShowCreateForm(false)
      setFormData({ name: '', description: '', address: '', phone: '', email: '', website: '' })
      fetchOrganizations()
    } catch (error) {
      console.error('조직 생성 오류:', error)
      showAlert(error instanceof Error ? error.message : '조직 생성에 실패했습니다.', 'error')
    }
  }

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingOrganization) return

    try {
      const response = await fetch(`/api/organizations/${editingOrganization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '조직 수정에 실패했습니다.')
      }

      showAlert('조직 정보가 성공적으로 수정되었습니다.', 'success')
      setEditingOrganization(null)
      setFormData({ name: '', description: '', address: '', phone: '', email: '', website: '' })
      fetchOrganizations()
    } catch (error) {
      console.error('조직 수정 오류:', error)
      showAlert(error instanceof Error ? error.message : '조직 수정에 실패했습니다.', 'error')
    }
  }

  const handleDeleteOrganization = async (organizationId: string) => {
    showConfirm(
      '정말로 이 조직을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      async () => {

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '조직 삭제에 실패했습니다.')
      }

        showAlert('조직이 성공적으로 삭제되었습니다.', 'success')
        fetchOrganizations()
      } catch (error) {
        console.error('조직 삭제 오류:', error)
        showAlert(error instanceof Error ? error.message : '조직 삭제에 실패했습니다.', 'error')
      }
    },
    {
      type: 'error',
      title: '조직 삭제',
      confirmText: '삭제',
      cancelText: '취소'
    })
  }

  const startEdit = (organization: Organization) => {
    setEditingOrganization(organization)
    setFormData({
      name: organization.name,
      description: organization.description || '',
      address: organization.address || '',
      phone: organization.phone || '',
      email: organization.email || '',
      website: organization.website || ''
    })
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
    <PermissionGuard permission="canManageOrganizations">
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">조직 관리</h1>
            <Button onClick={() => setShowCreateForm(true)}>
              새 조직 추가
            </Button>
          </div>

          {/* 검색 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>검색</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">검색</Label>
                  <Input
                    id="search"
                    placeholder="조직명 또는 설명으로 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch}>검색</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 조직 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>조직 목록</CardTitle>
              <CardDescription>
                총 {pagination?.total || 0}개의 조직
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">로딩 중...</div>
              ) : (
                <div className="space-y-4">
                  {organizations.map(organization => (
                    <div key={organization.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{organization.name}</h3>
                        {organization.description && (
                          <p className="text-sm text-gray-600 mt-1">{organization.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>사용자: {organization._count?.users || 0}명</span>
                          <span>프로젝트: {organization._count?.projects || 0}개</span>
                          {organization.email && <span>이메일: {organization.email}</span>}
                          {organization.phone && <span>전화: {organization.phone}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(organization)}>
                          수정
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteOrganization(organization.id)}
                          disabled={(organization._count?.users || 0) > 0 || (organization._count?.projects || 0) > 0}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
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
                      onClick={() => fetchOrganizations(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 생성/수정 폼 모달 */}
          {(showCreateForm || editingOrganization) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>{editingOrganization ? '조직 수정' : '새 조직 추가'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={editingOrganization ? handleUpdateOrganization : handleCreateOrganization} className="space-y-4">
                    <div>
                      <Label htmlFor="name">조직명 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">설명</Label>
                      <textarea
                        id="description"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">주소</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">전화번호</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">웹사이트</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingOrganization ? '수정' : '생성'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowCreateForm(false)
                          setEditingOrganization(null)
                          setFormData({ name: '', description: '', address: '', phone: '', email: '', website: '' })
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
        </div>
        
        {/* Alert/Confirm Components */}
        <AlertComponent />
        <ConfirmComponent />
      </MainLayout>
    </PermissionGuard>
  )
} 