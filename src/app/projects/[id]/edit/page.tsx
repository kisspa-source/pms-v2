'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">프로젝트를 찾을 수 없습니다.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
        <h1 className="text-2xl font-bold">프로젝트 수정</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">프로젝트명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">고객사 *</Label>
                <select
                  id="client_id"
                  value={formData.client_id}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">고객사를 선택하세요</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_type">프로젝트 유형</Label>
                <select
                  id="project_type"
                  value={formData.project_type}
                  onChange={(e) => handleInputChange('project_type', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">프로젝트 유형을 선택하세요</option>
                  <option value="WEB">웹</option>
                  <option value="MOBILE">모바일</option>
                  <option value="SYSTEM">시스템</option>
                  <option value="CONSULTING">컨설팅</option>
                  <option value="MAINTENANCE">유지보수</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">상태를 선택하세요</option>
                  <option value="PLANNING">계획</option>
                  <option value="IN_PROGRESS">진행중</option>
                  <option value="ON_HOLD">보류</option>
                  <option value="COMPLETED">완료</option>
                  <option value="CANCELLED">취소</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">우선순위</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">우선순위를 선택하세요</option>
                  <option value="LOW">낮음</option>
                  <option value="MEDIUM">보통</option>
                  <option value="HIGH">높음</option>
                  <option value="CRITICAL">긴급</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_hours">예상 시간 (시간)</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">시작일</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">종료일</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_amount">예산 (원)</Label>
                <Input
                  id="budget_amount"
                  type="number"
                  value={formData.budget_amount}
                  onChange={(e) => handleInputChange('budget_amount', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_amount">계약금액 (원)</Label>
                <Input
                  id="contract_amount"
                  type="number"
                  value={formData.contract_amount}
                  onChange={(e) => handleInputChange('contract_amount', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}