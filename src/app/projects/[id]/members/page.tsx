'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
}

interface ProjectMember {
  id: string
  user_id: string
  role: string
  allocation_percentage: number
  hourly_rate?: number
  joined_at: string
  user: User
  stats?: {
    taskCount: number
    totalHours: number
  }
}

interface Project {
  id: string
  name: string
}

export default function ProjectMembersPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingMember, setAddingMember] = useState(false)

  const [newMember, setNewMember] = useState({
    user_id: '',
    role: '',
    allocation_percentage: 100,
    hourly_rate: '',
  })

  useEffect(() => {
    fetchProjectMembers()
    fetchAvailableUsers()
  }, [projectId])

  const fetchProjectMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setMembers(data.members)
      } else {
        toast.error('팀원 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('팀원 목록 조회 오류:', error)
      toast.error('팀원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data.users || [])
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingMember(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMember,
          hourly_rate: newMember.hourly_rate ? parseFloat(newMember.hourly_rate) : null,
        }),
      })

      if (response.ok) {
        toast.success('팀원이 추가되었습니다.')
        setShowAddForm(false)
        setNewMember({
          user_id: '',
          role: '',
          allocation_percentage: 100,
          hourly_rate: '',
        })
        fetchProjectMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || '팀원 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('팀원 추가 오류:', error)
      toast.error('팀원 추가에 실패했습니다.')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`${memberName}님을 프로젝트에서 제거하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('팀원이 제거되었습니다.')
        fetchProjectMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || '팀원 제거에 실패했습니다.')
      }
    } catch (error) {
      console.error('팀원 제거 오류:', error)
      toast.error('팀원 제거에 실패했습니다.')
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      PMO: 'PMO',
      PM: '프로젝트 매니저',
      PL: '프로젝트 리더',
      DEVELOPER: '개발자',
      DESIGNER: '디자이너',
      CONSULTANT: '컨설턴트',
    }
    return roleMap[role] || role
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            프로젝트로 돌아가기
          </Button>
          <h1 className="text-2xl font-bold">
            {project?.name} - 팀원 관리
          </h1>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          팀원 추가
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>새 팀원 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">사용자 *</Label>
                  <select
                    id="user_id"
                    value={newMember.user_id}
                    onChange={(e) => setNewMember(prev => ({ ...prev, user_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">사용자를 선택하세요</option>
                    {availableUsers
                      .filter(user => !members.some(member => member.user_id === user.id))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">역할 *</Label>
                  <select
                    id="role"
                    value={newMember.role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">역할을 선택하세요</option>
                    <option value="PMO">PMO</option>
                    <option value="PM">프로젝트 매니저</option>
                    <option value="PL">프로젝트 리더</option>
                    <option value="DEVELOPER">개발자</option>
                    <option value="DESIGNER">디자이너</option>
                    <option value="CONSULTANT">컨설턴트</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allocation_percentage">할당률 (%)</Label>
                  <Input
                    id="allocation_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={newMember.allocation_percentage}
                    onChange={(e) => setNewMember(prev => ({ ...prev, allocation_percentage: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">시급 (원)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={newMember.hourly_rate}
                    onChange={(e) => setNewMember(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={addingMember}>
                  {addingMember ? '추가 중...' : '추가'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 팀원 ({members.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 배정된 팀원이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {member.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-lg">{member.user.name}</div>
                        <div className="text-sm text-gray-600">{member.user.email}</div>
                        <div className="text-sm text-gray-500">{member.user.department}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${projectId}/members/${member.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.user.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">역할</div>
                      <div>{getRoleDisplayName(member.role)}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">할당률</div>
                      <div>{member.allocation_percentage}%</div>
                    </div>
                    {member.hourly_rate && (
                      <div>
                        <div className="font-medium text-gray-700">시급</div>
                        <div>{member.hourly_rate.toLocaleString()}원</div>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-700">참여일</div>
                      <div>{new Date(member.joined_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {member.stats && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded">
                      <div>
                        <div className="font-medium text-gray-700">할당된 작업</div>
                        <div>{member.stats.taskCount}개</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">총 작업 시간</div>
                        <div>{member.stats.totalHours}시간</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}