'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/loading'
import { Client, ClientStatus } from '@/types/project'
import { Plus, Search, Filter, Eye, Edit, Trash2, Building, Mail, Phone, Globe, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'

interface ClientListResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    statusDistribution: Record<string, number>
    totalClients: number
  }
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    industry: '',
    organizationId: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [stats, setStats] = useState<{
    statusDistribution: Record<string, number>
    totalClients: number
  }>({
    statusDistribution: {},
    totalClients: 0
  })
  const [showFilters, setShowFilters] = useState(false)

  // 고객사 목록 조회
  const fetchClients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        ...filters
      })

      const response = await fetch(`/api/clients?${params}`)
      if (!response.ok) throw new Error('고객사 목록을 불러오는데 실패했습니다.')

      const data: ClientListResponse = await response.json()
      setClients(data.clients || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
      setStats(data.stats || { statusDistribution: {}, totalClients: 0 })
    } catch (error) {
      console.error('고객사 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 검색 및 필터 적용
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchClients()
  }

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      status: '',
      industry: '',
      organizationId: ''
    })
    setSearchTerm('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // 고객사 삭제
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('정말로 이 고객사를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('고객사 삭제에 실패했습니다.')

      // 목록 새로고침
      fetchClients()
    } catch (error) {
      console.error('고객사 삭제 오류:', error)
      alert('고객사 삭제 중 오류가 발생했습니다.')
    }
  }

  // 상태별 색상
  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case ClientStatus.ACTIVE: return 'bg-green-100 text-green-800'
      case ClientStatus.INACTIVE: return 'bg-gray-100 text-gray-800'
      case ClientStatus.PROSPECT: return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    fetchClients()
  }, [pagination.page])

  if (loading) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* 헤더 - 컴팩트 버전 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-soft border border-blue-100 fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">고객사 관리</h1>
            <p className="text-gray-600 text-sm">전체 {stats?.totalClients || 0}개 고객사를 관리하고 있습니다 ✨</p>
          </div>
          <Link href="/clients/new">
            <Button className="flex items-center gap-2 btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large transition-all duration-300 h-10 px-4 w-full sm:w-auto text-sm">
              <Plus className="w-4 h-4" />
              새 고객사
            </Button>
          </Link>
        </div>

        {/* 통계 카드 - 매우 컴팩트 버전 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md fade-in">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">전체</p>
                  <p className="text-lg font-bold text-gray-800">{stats?.totalClients || 0}</p>
                </div>
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md">
                  <Building className="w-3 h-3 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md fade-in" style={{animationDelay: '100ms'}}>
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">활성</p>
                  <p className="text-lg font-bold text-gray-800">{stats?.statusDistribution?.[ClientStatus.ACTIVE] || 0}</p>
                </div>
                <div className="p-1.5 bg-gradient-to-r from-green-500 to-green-600 rounded-md">
                  <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md fade-in" style={{animationDelay: '200ms'}}>
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">잠재</p>
                  <p className="text-lg font-bold text-gray-800">{stats?.statusDistribution?.[ClientStatus.PROSPECT] || 0}</p>
                </div>
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md">
                  <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md fade-in" style={{animationDelay: '300ms'}}>
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">비활성</p>
                  <p className="text-lg font-bold text-gray-800">{stats?.statusDistribution?.[ClientStatus.INACTIVE] || 0}</p>
                </div>
                <div className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 rounded-md">
                  <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 - 컴팩트 버전 */}
        <Card className="modern-card transition-all duration-300 shadow-sm hover:shadow-md border-0 mb-4">
          <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="고객사명, 담당자, 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-9 input-modern text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 hover-lift h-9 px-3 text-sm"
              >
                <Filter className="w-3 h-3" />
                필터
              </Button>
              <Button onClick={handleSearch} className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-9 px-3 text-sm">검색</Button>
              <Button variant="outline" onClick={clearFilters} className="hover-lift h-9 px-3 text-sm">초기화</Button>
            </div>
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
              <div>
                <Label htmlFor="status" className="text-xs">상태</Label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm h-8"
                >
                  <option value="">전체</option>
                  {Object.values(ClientStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="industry" className="text-xs">산업</Label>
                <Input
                  id="industry"
                  placeholder="산업 분야"
                  value={filters.industry}
                  onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="organizationId" className="text-xs">조직</Label>
                <Input
                  id="organizationId"
                  placeholder="조직 ID"
                  value={filters.organizationId}
                  onChange={(e) => setFilters(prev => ({ ...prev, organizationId: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

        {/* 고객사 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {clients.map((client, index) => (
            <Card key={client.id} className="modern-card hover-lift hover-scale transition-all duration-300 border-0 shadow-medium hover:shadow-large fade-in" style={{animationDelay: `${index * 50}ms`}}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {client.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Link href={`/clients/${client.id}`}>
                    <Button variant="ghost" size="sm" className="hover-scale bg-blue-50 hover:bg-blue-100 text-blue-600">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/clients/${client.id}/edit`}>
                    <Button variant="ghost" size="sm" className="hover-scale bg-green-50 hover:bg-green-100 text-green-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                    className="hover-scale bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {client.status}
                </span>
                {client.company_type && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {client.company_type}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* 연락처 정보 */}
                <div className="space-y-2">
                  {client.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{client.contact_person}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>{client.website}</span>
                    </div>
                  )}
                </div>

                {/* 추가 정보 */}
                <div className="space-y-2 text-sm">
                  {client.industry && (
                    <div>
                      <strong>산업:</strong> {client.industry}
                    </div>
                  )}
                  {client.address && (
                    <div>
                      <strong>주소:</strong> {client.address}
                    </div>
                  )}
                  {client.organization && (
                    <div>
                      <strong>조직:</strong> {client.organization.name}
                    </div>
                  )}
                  <div>
                    <strong>프로젝트:</strong> {client._count?.projects || 0}개
                  </div>
                </div>

                {/* 메모 */}
                {client.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>메모:</strong> {client.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          ))}
        </div>

        {/* 페이지네이션 - 컴팩트 버전 */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="hover-lift h-8 px-3 text-sm"
              >
                이전
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === pagination.page ? "default" : "outline"}
                  onClick={() => handlePageChange(page)}
                  className={page === pagination.page ? "btn-modern bg-gradient-to-r from-blue-600 to-purple-600 h-8 px-3 text-sm" : "hover-lift h-8 px-3 text-sm"}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="hover-lift h-8 px-3 text-sm"
              >
                다음
              </Button>
            </div>
          </div>
        )}

        {/* 빈 상태 - 컴팩트 버전 */}
        {clients.length === 0 && !loading && (
          <div className="text-center py-12 fade-in">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">고객사가 없습니다</h3>
            <p className="text-gray-600 mb-6">새 고객사를 등록하여 시작하세요.</p>
            <Link href="/clients/new">
              <Button className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-10 px-6 text-sm">
                <Plus className="w-4 h-4 mr-2" />
                새 고객사 등록
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 