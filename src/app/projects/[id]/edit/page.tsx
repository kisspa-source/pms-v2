'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, FileText, Calendar, DollarSign, Target, AlertCircle, Building2, Users, Settings, BarChart3, Edit } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import MainLayout from '@/components/layout/MainLayout'

interface Project {
  id: string
  name: string
  description: string | null
  project_type: string | null
  status: string
  priority: string
  start_date: string | null
  end_date: string | null
  estimated_hours: number | null
  budget_amount: number | null
  contract_amount: number | null
  client_id: string
  organization_id: string
}

interface Client {
  id: string
  name: string
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: '',
    status: '',
    priority: '',
    start_date: '',
    end_date: '',
    estimated_hours: '',
    budget_amount: '',
    contract_amount: '',
    client_id: '',
  })

  useEffect(() => {
    fetchProject()
    fetchClients()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          project_type: data.project_type || '',
          status: data.status || '',
          priority: data.priority || '',
          start_date: data.start_date ? data.start_date.split('T')[0] : '',
          end_date: data.end_date ? data.end_date.split('T')[0] : '',
          estimated_hours: data.estimated_hours?.toString() || '',
          budget_amount: data.budget_amount?.toString() || '',
          contract_amount: data.contract_amount?.toString() || '',
          client_id: data.client_id || '',
        })
      } else {
        toast.error('프로젝트를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 조회 오류:', error)
      toast.error('프로젝트를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('고객사 목록 조회 오류:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
          budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
          contract_amount: formData.contract_amount ? parseFloat(formData.contract_amount) : null,
        }),
      })

      if (response.ok) {
        toast.success('프로젝트가 수정되었습니다.')
        router.push(`/projects/${projectId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || '프로젝트 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 수정 오류:', error)
      toast.error('프로젝트 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">프로젝트 정보를 불러오는 중...</h3>
              <p className="text-gray-600">잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">프로젝트를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-8 text-lg">요청하신 프로젝트가 존재하지 않거나 접근 권한이 없습니다.</p>
            <Link href="/projects">
              <Button className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                프로젝트 목록으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-soft border border-blue-100">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="hover-lift"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">프로젝트 수정 ✏️</h1>
            <p className="text-gray-600 text-lg">프로젝트 정보를 수정하여 더 나은 관리를 시작하세요</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Edit className="w-4 h-4" />
          <span>프로젝트 정보 편집</span>
        </div>
      </div>

      {/* 진행 단계 표시 */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="ml-2 text-sm font-medium text-blue-600">기본 정보</span>
          </div>
          <div className="w-16 h-1 bg-blue-200 rounded"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="ml-2 text-sm font-medium text-blue-600">일정 & 예산</span>
          </div>
          <div className="w-16 h-1 bg-blue-200 rounded"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="ml-2 text-sm font-medium text-blue-600">저장</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 기본 정보 */}
          <div className="lg:col-span-2">
            <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  기본 정보
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">프로젝트의 기본적인 정보를 수정해주세요</p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Target className="w-4 h-4 text-blue-600" />
                    프로젝트명 *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="예: 웹사이트 리뉴얼 프로젝트"
                    required
                    className="input-modern h-12"
                  />
                  <p className="text-xs text-gray-500">명확하고 구체적인 프로젝트명을 입력해주세요</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText className="w-4 h-4 text-blue-600" />
                    프로젝트 설명
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="프로젝트의 목표, 범위, 주요 기능 등을 상세히 설명해주세요..."
                    rows={4}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                  <p className="text-xs text-gray-500">프로젝트의 목적과 범위를 명확히 기술해주세요</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="client_id" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Users className="w-4 h-4 text-blue-600" />
                      고객사 *
                    </Label>
                    <select
                      id="client_id"
                      value={formData.client_id}
                      onChange={(e) => handleInputChange('client_id', e.target.value)}
                      required
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">고객사를 선택하세요</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">프로젝트를 의뢰한 고객사를 선택해주세요</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project_type" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Settings className="w-4 h-4 text-blue-600" />
                      프로젝트 타입
                    </Label>
                    <select
                      id="project_type"
                      value={formData.project_type}
                      onChange={(e) => handleInputChange('project_type', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">프로젝트 타입을 선택하세요</option>
                      <option value="WEB">웹 개발</option>
                      <option value="MOBILE">모바일 앱</option>
                      <option value="SYSTEM">시스템 개발</option>
                      <option value="CONSULTING">컨설팅</option>
                      <option value="MAINTENANCE">유지보수</option>
                    </select>
                    <p className="text-xs text-gray-500">프로젝트의 성격에 맞는 타입을 선택해주세요</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      프로젝트 상태
                    </Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">상태를 선택하세요</option>
                      <option value="PLANNING">계획</option>
                      <option value="IN_PROGRESS">진행중</option>
                      <option value="ON_HOLD">보류</option>
                      <option value="COMPLETED">완료</option>
                      <option value="CANCELLED">취소</option>
                    </select>
                    <p className="text-xs text-gray-500">현재 프로젝트의 진행 상태를 선택해주세요</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      우선순위
                    </Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">우선순위를 선택하세요</option>
                      <option value="LOW">낮음</option>
                      <option value="MEDIUM">보통</option>
                      <option value="HIGH">높음</option>
                      <option value="CRITICAL">긴급</option>
                    </select>
                    <p className="text-xs text-gray-500">프로젝트의 중요도를 설정해주세요</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 일정 및 예산 */}
          <div className="space-y-6">
            <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  일정 관리
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">프로젝트 일정을 설정해주세요</p>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-green-600" />
                    시작일
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="input-modern h-12"
                  />
                  <p className="text-xs text-gray-500">프로젝트 시작 예정일을 선택해주세요</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-green-600" />
                    종료일
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className="input-modern h-12"
                  />
                  <p className="text-xs text-gray-500">프로젝트 완료 목표일을 선택해주세요</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_hours" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Target className="w-4 h-4 text-green-600" />
                    예상 시간 (시간)
                  </Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                    placeholder="예: 160"
                    className="input-modern h-12"
                  />
                  <p className="text-xs text-gray-500">프로젝트 완료에 필요한 총 작업 시간을 입력해주세요</p>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  예산 관리
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">프로젝트 예산을 설정해주세요</p>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label htmlFor="budget_amount" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    프로젝트 예산
                  </Label>
                  <Input
                    id="budget_amount"
                    type="number"
                    value={formData.budget_amount}
                    onChange={(e) => handleInputChange('budget_amount', e.target.value)}
                    placeholder="예: 50000000"
                    className="input-modern h-12"
                  />
                  <p className="text-xs text-gray-500">프로젝트 진행에 필요한 총 예산을 입력해주세요</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_amount" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    계약 금액
                  </Label>
                  <Input
                    id="contract_amount"
                    type="number"
                    value={formData.contract_amount}
                    onChange={(e) => handleInputChange('contract_amount', e.target.value)}
                    placeholder="예: 45000000"
                    className="input-modern h-12"
                  />
                  <p className="text-xs text-gray-500">고객사와 체결한 실제 계약 금액을 입력해주세요</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-8">
          <Card className="modern-card border-0 shadow-medium bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <span>모든 정보를 확인하신 후 프로젝트를 저장해주세요</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="hover-lift px-6 h-12"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large px-8 h-12"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        프로젝트 저장
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* 도움말 섹션 */}
      <div className="mt-8">
        <Card className="modern-card border-0 shadow-medium bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">프로젝트 수정 가이드</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>프로젝트명</strong>: 명확하고 구체적인 이름을 사용하세요</li>
                  <li>• <strong>설명</strong>: 프로젝트의 목표와 범위를 상세히 기술하세요</li>
                  <li>• <strong>일정</strong>: 현실적이고 달성 가능한 일정을 설정하세요</li>
                  <li>• <strong>예산</strong>: 정확한 예산 정보로 프로젝트 수익성을 관리하세요</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </MainLayout>
  )
}