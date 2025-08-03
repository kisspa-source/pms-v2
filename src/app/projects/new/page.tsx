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
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

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
    return <Loading />
  }

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/projects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            프로젝트 목록
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">새 프로젝트 생성</h1>
          <p className="text-gray-600 mt-2">새로운 프로젝트를 생성합니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 기본 정보 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">프로젝트명 *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="프로젝트명을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="프로젝트 설명을 입력하세요"
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organization_id">조직 *</Label>
                    <select
                      id="organization_id"
                      name="organization_id"
                      value={formData.organization_id}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">조직을 선택하세요</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="client_id">고객사 *</Label>
                    <select
                      id="client_id"
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">고객사를 선택하세요</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_type">프로젝트 타입</Label>
                    <select
                      id="project_type"
                      name="project_type"
                      value={formData.project_type}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.values(ProjectType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority">우선순위</Label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.values(Priority).map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 일정 및 예산 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>일정 및 예산</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="start_date">시작일</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">종료일</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_hours">예상 시간 (시간)</Label>
                  <Input
                    id="estimated_hours"
                    name="estimated_hours"
                    type="number"
                    value={formData.estimated_hours}
                    onChange={handleInputChange}
                    placeholder="예상 작업 시간"
                  />
                </div>

                <div>
                  <Label htmlFor="budget_amount">예산</Label>
                  <Input
                    id="budget_amount"
                    name="budget_amount"
                    type="number"
                    value={formData.budget_amount}
                    onChange={handleInputChange}
                    placeholder="프로젝트 예산"
                  />
                </div>

                <div>
                  <Label htmlFor="contract_amount">계약금액</Label>
                  <Input
                    id="contract_amount"
                    name="contract_amount"
                    type="number"
                    value={formData.contract_amount}
                    onChange={handleInputChange}
                    placeholder="계약 금액"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">통화</Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="KRW">KRW (원)</option>
                    <option value="USD">USD (달러)</option>
                    <option value="EUR">EUR (유로)</option>
                    <option value="JPY">JPY (엔)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/projects">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
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
      </form>
    </div>
  )
}