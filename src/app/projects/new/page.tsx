'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/loading'
import { ProjectType, Priority } from '@/types/project'
import { ArrowLeft, Save, Building2, Users, Calendar, DollarSign, Target, FileText, Settings, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'

interface Client {
  id: string
  name: string
  contact_person?: string
  email?: string
}

interface Organization {
  id: string
  name: string
}

export default function NewProjectPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [formData, setFormData] = useState({
    organization_id: '',
    client_id: '',
    name: '',
    description: '',
    project_type: ProjectType.WEB,
    priority: Priority.MEDIUM,
    start_date: '',
    end_date: '',
    estimated_hours: '',
    budget_amount: '',
    contract_amount: '',
    currency: 'KRW'
  })

  // 클라이언트 목록 조회
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('클라이언트 목록 조회 오류:', error)
    }
  }

  // 조직 목록 조회
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

  // 폼 데이터 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 프로젝트 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.client_id || !formData.organization_id) {
      alert('프로젝트명, 고객사, 조직은 필수입니다.')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined,
          budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : undefined,
          contract_amount: formData.contract_amount ? parseFloat(formData.contract_amount) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '프로젝트 생성에 실패했습니다.')
      }

      const newProject = await response.json()
      router.push(`/projects/${newProject.id}`)
    } catch (error) {
      console.error('프로젝트 생성 오류:', error)
      alert(error instanceof Error ? error.message : '프로젝트 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
    fetchOrganizations()
  }, [])

  if (!session) {
    return (
      <MainLayout>
        <Loading />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-soft border border-blue-100">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="outline" size="sm" className="hover-lift">
                <ArrowLeft className="w-4 h-4 mr-2" />
                프로젝트 목록
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">새 프로젝트 생성 ✨</h1>
              <p className="text-gray-600 text-lg">새로운 프로젝트를 생성하여 팀과 함께 성공적인 결과를 만들어보세요</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="w-4 h-4" />
            <span>단계별 프로젝트 설정</span>
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
              <span className="ml-2 text-sm font-medium text-blue-600">완료</span>
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
                <p className="text-gray-600 text-sm mt-2">프로젝트의 기본적인 정보를 입력해주세요</p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Target className="w-4 h-4 text-blue-600" />
                    프로젝트명 *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
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
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="프로젝트의 목표, 범위, 주요 기능 등을 상세히 설명해주세요..."
                    rows={4}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                  <p className="text-xs text-gray-500">프로젝트의 목적과 범위를 명확히 기술해주세요</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organization_id" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      조직 *
                    </Label>
                    <select
                      id="organization_id"
                      name="organization_id"
                      value={formData.organization_id}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">조직을 선택하세요</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">프로젝트를 진행할 조직을 선택해주세요</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_id" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Users className="w-4 h-4 text-blue-600" />
                      고객사 *
                    </Label>
                    <select
                      id="client_id"
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">고객사를 선택하세요</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">프로젝트를 의뢰한 고객사를 선택해주세요</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="project_type" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Settings className="w-4 h-4 text-blue-600" />
                      프로젝트 타입
                    </Label>
                    <select
                      id="project_type"
                      name="project_type"
                      value={formData.project_type}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      {Object.values(ProjectType).map(type => (
                        <option key={type} value={type}>
                          {type === 'WEB' ? '웹 개발' :
                           type === 'MOBILE' ? '모바일 앱' :
                           type === 'SYSTEM' ? '시스템 개발' :
                           type === 'CONSULTING' ? '컨설팅' :
                           type === 'MAINTENANCE' ? '유지보수' : type}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">프로젝트의 성격에 맞는 타입을 선택해주세요</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      우선순위
                    </Label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      {Object.values(Priority).map(priority => (
                        <option key={priority} value={priority}>
                          {priority === 'LOW' ? '낮음' :
                           priority === 'MEDIUM' ? '보통' :
                           priority === 'HIGH' ? '높음' :
                           priority === 'CRITICAL' ? '긴급' : priority}
                        </option>
                      ))}
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
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleInputChange}
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
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleInputChange}
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
                    name="estimated_hours"
                    type="number"
                    value={formData.estimated_hours}
                    onChange={handleInputChange}
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
                    name="budget_amount"
                    type="number"
                    value={formData.budget_amount}
                    onChange={handleInputChange}
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
                    name="contract_amount"
                    type="number"
                    value={formData.contract_amount}
                    onChange={handleInputChange}
                    placeholder="예: 45000000"
                    className="input-modern h-12"
                  />
                  <p className="text-xs text-gray-500">고객사와 체결한 실제 계약 금액을 입력해주세요</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    통화
                  </Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="KRW">🇰🇷 KRW (원)</option>
                    <option value="USD">🇺🇸 USD (달러)</option>
                    <option value="EUR">🇪🇺 EUR (유로)</option>
                    <option value="JPY">🇯🇵 JPY (엔)</option>
                  </select>
                  <p className="text-xs text-gray-500">프로젝트에서 사용할 통화를 선택해주세요</p>
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
                  <span>모든 필수 정보를 입력하신 후 프로젝트를 생성해주세요</span>
                </div>
                <div className="flex gap-3">
                  <Link href="/projects">
                    <Button type="button" variant="outline" className="hover-lift px-6 h-12">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      취소
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large px-8 h-12"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        프로젝트 생성
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
                <h3 className="font-semibold text-gray-800 mb-2">프로젝트 생성 가이드</h3>
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