'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Plus, Trash2, Edit, Users, Target, BarChart3, Clock, X, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import MainLayout from '@/components/layout/MainLayout'
import { useAlert, useConfirm } from '@/components/ui/alert-dialog'

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
  avatar_url?: string
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
  const { showAlert, AlertComponent } = useAlert()
  const { showConfirm, ConfirmComponent } = useConfirm()

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
        // API 응답 구조에 따라 처리
        if (Array.isArray(data)) {
          setAvailableUsers(data)
        } else if (data.users && Array.isArray(data.users)) {
          setAvailableUsers(data.users)
        } else {
          console.error('예상하지 못한 API 응답 구조:', data)
          setAvailableUsers([])
        }
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
      setAvailableUsers([])
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
    showConfirm(
      `${memberName}님을 프로젝트에서 제거하시겠습니까?`,
      async () => {
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
    )
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
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">팀원 정보를 불러오는 중...</h3>
              <p className="text-gray-600">잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-soft border border-blue-100">
          <div className="flex items-start gap-4 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}`)}
              className="hover-lift"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              프로젝트로 돌아가기
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                  {project?.name} - 팀원 관리
                </h1>
              </div>
              <p className="text-gray-600 text-lg">프로젝트 팀원을 관리하고 역할을 배정하세요</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            팀원 추가
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{members.length}</div>
                  <div className="text-sm text-gray-600">총 팀원</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {members.filter(m => m.role === 'PM' || m.role === 'PMO').length}
                  </div>
                  <div className="text-sm text-gray-600">관리자</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {members.length > 0 ? Math.round(members.reduce((sum, m) => sum + m.allocation_percentage, 0) / members.length) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">평균 할당률</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {members.reduce((sum, m) => sum + (m.stats?.totalHours || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">총 작업 시간</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 팀원 추가 폼 */}
        {showAddForm && (
          <Card className="modern-card border-0 shadow-medium mb-8">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">새 팀원 추가</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="hover-lift"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="user_id" className="text-sm font-semibold text-gray-700">사용자 *</Label>
                    <select
                      id="user_id"
                      value={newMember.user_id}
                      onChange={(e) => setNewMember(prev => ({ ...prev, user_id: e.target.value }))}
                      className="input-modern h-12"
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
                    {availableUsers.filter(user => !members.some(member => member.user_id === user.id)).length === 0 && (
                      <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                        추가할 수 있는 사용자가 없습니다. 모든 사용자가 이미 프로젝트에 참여하고 있습니다.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-gray-700">역할 *</Label>
                    <select
                      id="role"
                      value={newMember.role}
                      onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                      className="input-modern h-12"
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
                    <Label htmlFor="allocation_percentage" className="text-sm font-semibold text-gray-700">할당률 (%)</Label>
                    <Input
                      id="allocation_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={newMember.allocation_percentage}
                      onChange={(e) => setNewMember(prev => ({ ...prev, allocation_percentage: parseInt(e.target.value) || 0 }))}
                      className="input-modern h-12"
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate" className="text-sm font-semibold text-gray-700">시급 (원)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={newMember.hourly_rate}
                      onChange={(e) => setNewMember(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      className="input-modern h-12"
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="hover-lift h-12 px-6"
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addingMember}
                    className="btn-modern bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-medium hover:shadow-large h-12 px-8"
                  >
                    {addingMember ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        추가 중...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        팀원 추가
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 팀원 목록 */}
        <Card className="modern-card border-0 shadow-medium">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-700" />
              프로젝트 팀원 ({members.length}명)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {members.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">팀원이 없습니다</h3>
                <p className="text-gray-600 mb-6">프로젝트에 참여할 팀원을 추가해보세요.</p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  첫 번째 팀원 추가하기
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((member) => (
                  <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {/* 아바타 */}
                        <Avatar
                          src={member.user.avatar_url}
                          alt={member.user.name}
                          fallback={member.user.name.charAt(0).toUpperCase()}
                          size="xl"
                          className="shadow-medium border-2 border-white"
                        />

                        {/* 기본 정보 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">{member.user.name}</h3>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {getRoleDisplayName(member.role)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              {member.user.email}
                            </span>
                            {member.user.department && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                {member.user.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/projects/${projectId}/members/${member.id}/edit`)}
                          className="hover-lift"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.user.name)}
                          className="hover-lift text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* 상세 정보 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-sm text-gray-500 mb-1">할당률</div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${member.allocation_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {member.allocation_percentage}%
                          </span>
                        </div>
                      </div>
                      
                      {member.hourly_rate && (
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-500 mb-1">시급</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {member.hourly_rate.toLocaleString()}원
                          </div>
                        </div>
                      )}
                      
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-sm text-gray-500 mb-1">참여일</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>

                      {member.stats && (
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-500 mb-1">작업/시간</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {member.stats.taskCount}개 / {member.stats.totalHours}h
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 통계 정보 (확장된 경우) */}
                    {member.stats && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">할당된 작업</div>
                            <div className="text-lg font-bold text-gray-800">{member.stats.taskCount}개</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Clock className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">총 작업 시간</div>
                            <div className="text-lg font-bold text-gray-800">{member.stats.totalHours}시간</div>
                          </div>
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
    </MainLayout>
  )
}