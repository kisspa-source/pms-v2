'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar } from '@/components/ui/avatar'
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Clock, 
  Palette, 
  Building2,
  Save,
  Camera,
  Key,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'

interface UserSettings {
  id: string
  name: string
  email: string
  phone?: string
  department?: string
  avatar_url?: string
  timezone: string
  language: string
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email_notifications: boolean
    push_notifications: boolean
    project_updates: boolean
    task_assignments: boolean
    comments: boolean
    deadlines: boolean
    weekly_reports: boolean
  }
  work_preferences: {
    default_work_hours: number
    start_time: string
    end_time: string
    break_duration: number
  }
}

interface OrganizationSettings {
  default_currency: string
  default_timezone: string
  working_days: string[]
  project_code_format: string
  auto_assign_tasks: boolean
  require_time_tracking: boolean
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { allPermissions } = usePermissions()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [userSettings, setUserSettings] = useState<UserSettings>({
    id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    avatar_url: '',
    timezone: 'Asia/Seoul',
    language: 'ko',
    theme: 'system',
    notifications: {
      email_notifications: true,
      push_notifications: true,
      project_updates: true,
      task_assignments: true,
      comments: true,
      deadlines: true,
      weekly_reports: false
    },
    work_preferences: {
      default_work_hours: 8,
      start_time: '09:00',
      end_time: '18:00',
      break_duration: 60
    }
  })

  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    default_currency: 'KRW',
    default_timezone: 'Asia/Seoul',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    project_code_format: 'PRJ-{YYYY}-{###}',
    auto_assign_tasks: false,
    require_time_tracking: true
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    if (session) {
      fetchUserSettings()
      if (allPermissions.canManageOrganizations) {
        fetchOrganizationSettings()
      }
    }
  }, [session, allPermissions])

  const fetchUserSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/user')
      if (response.ok) {
        const data = await response.json()
        setUserSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('사용자 설정 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizationSettings = async () => {
    try {
      const response = await fetch('/api/settings/organization')
      if (response.ok) {
        const data = await response.json()
        setOrgSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('조직 설정 조회 오류:', error)
    }
  }

  const saveUserSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userSettings)
      })

      if (response.ok) {
        toast.success('설정이 저장되었습니다.')
      } else {
        throw new Error('설정 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('설정 저장 오류:', error)
      toast.error('설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const saveOrganizationSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgSettings)
      })

      if (response.ok) {
        toast.success('조직 설정이 저장되었습니다.')
      } else {
        throw new Error('조직 설정 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('조직 설정 저장 오류:', error)
      toast.error('조직 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('새 비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      })

      if (response.ok) {
        toast.success('비밀번호가 변경되었습니다.')
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      } else {
        const error = await response.json()
        throw new Error(error.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      toast.error(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB를 초과할 수 없습니다.')
      return
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP만 지원)')
      return
    }

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/settings/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setUserSettings(prev => ({ ...prev, avatar_url: data.avatar_url }))
        // 세션 업데이트
        await update({ avatar_url: data.avatar_url })
        toast.success('프로필 사진이 업데이트되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.error || '프로필 사진 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로필 사진 업로드 오류:', error)
      toast.error(error instanceof Error ? error.message : '프로필 사진 업로드에 실패했습니다.')
    } finally {
      setSaving(false)
      // 파일 입력 초기화
      event.target.value = ''
    }
  }

  const handleAvatarDelete = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/avatar', {
        method: 'DELETE'
      })

      if (response.ok) {
        setUserSettings(prev => ({ ...prev, avatar_url: '' }))
        // 세션 업데이트
        await update({ avatar_url: null })
        toast.success('프로필 사진이 삭제되었습니다.')
      } else {
        const error = await response.json()
        throw new Error(error.error || '프로필 사진 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로필 사진 삭제 오류:', error)
      toast.error(error instanceof Error ? error.message : '프로필 사진 삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'notifications', label: '알림', icon: Bell },
    { id: 'appearance', label: '화면', icon: Palette },
    { id: 'work', label: '작업 환경', icon: Clock },
    { id: 'security', label: '보안', icon: Shield },
    ...(allPermissions.canManageOrganizations ? [{ id: 'organization', label: '조직 설정', icon: Building2 }] : [])
  ]

  if (!session) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">설정을 변경하려면 로그인해주세요.</p>
            <Button onClick={() => router.push('/login')}>로그인</Button>
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
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">설정 ⚙️</h1>
            <p className="text-gray-600 text-lg">시스템과 개인 환경을 맞춤 설정하세요</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <SettingsIcon className="w-4 h-4" />
            <span>개인화 설정</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사이드바 탭 */}
          <div className="lg:col-span-1">
            <Card className="modern-card border-0 shadow-medium">
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover-scale ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-medium'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    프로필 설정
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">개인 정보와 연락처를 관리하세요</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* 아바타 섹션 */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar
                        src={userSettings.avatar_url}
                        alt="프로필 사진"
                        fallback={userSettings.name?.charAt(0) || 'U'}
                        size="2xl"
                      />
                      <label 
                        htmlFor="avatar-upload"
                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-gray-600" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{userSettings.name}</h3>
                      <p className="text-sm text-gray-600">{session.user?.role}</p>
                      <div className="flex gap-2 mt-2">
                        <label htmlFor="avatar-upload">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="cursor-pointer"
                            disabled={saving}
                            asChild
                          >
                            <span>
                              <Camera className="w-4 h-4 mr-2" />
                              사진 변경
                            </span>
                          </Button>
                        </label>
                        {userSettings.avatar_url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleAvatarDelete}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        JPEG, PNG, GIF, WebP 형식 (최대 5MB)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <User className="w-4 h-4 text-blue-600" />
                        이름 *
                      </Label>
                      <Input
                        id="name"
                        value={userSettings.name}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                        className="input-modern h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Mail className="w-4 h-4 text-blue-600" />
                        이메일 *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                        className="input-modern h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Phone className="w-4 h-4 text-blue-600" />
                        전화번호
                      </Label>
                      <Input
                        id="phone"
                        value={userSettings.phone || ''}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="010-1234-5678"
                        className="input-modern h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        부서
                      </Label>
                      <Input
                        id="department"
                        value={userSettings.department || ''}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="개발팀"
                        className="input-modern h-12"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={saveUserSettings}
                      disabled={saving}
                      className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-8"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    알림 설정
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">받고 싶은 알림을 선택하세요</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-800">이메일 알림</div>
                          <div className="text-sm text-gray-600">중요한 업데이트를 이메일로 받습니다</div>
                        </div>
                      </div>
                      <Switch
                        checked={userSettings.notifications.email_notifications}
                        onCheckedChange={(checked) => 
                          setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email_notifications: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-800">푸시 알림</div>
                          <div className="text-sm text-gray-600">브라우저 푸시 알림을 받습니다</div>
                        </div>
                      </div>
                      <Switch
                        checked={userSettings.notifications.push_notifications}
                        onCheckedChange={(checked) => 
                          setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, push_notifications: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-medium text-gray-800">프로젝트 업데이트</div>
                          <div className="text-sm text-gray-600">프로젝트 상태 변경 시 알림</div>
                        </div>
                      </div>
                      <Switch
                        checked={userSettings.notifications.project_updates}
                        onCheckedChange={(checked) => 
                          setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, project_updates: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="font-medium text-gray-800">작업 배정</div>
                          <div className="text-sm text-gray-600">새로운 작업이 배정될 때 알림</div>
                        </div>
                      </div>
                      <Switch
                        checked={userSettings.notifications.task_assignments}
                        onCheckedChange={(checked) => 
                          setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, task_assignments: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium text-gray-800">마감일 알림</div>
                          <div className="text-sm text-gray-600">작업 마감일이 다가올 때 알림</div>
                        </div>
                      </div>
                      <Switch
                        checked={userSettings.notifications.deadlines}
                        onCheckedChange={(checked) => 
                          setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, deadlines: checked }
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={saveUserSettings}
                      disabled={saving}
                      className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-8"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Palette className="w-5 h-5 text-white" />
                    </div>
                    화면 설정
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">테마와 언어를 설정하세요</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">테마 선택</Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'light', label: '라이트', icon: Sun, desc: '밝은 테마' },
                          { id: 'dark', label: '다크', icon: Moon, desc: '어두운 테마' },
                          { id: 'system', label: '시스템', icon: Monitor, desc: '시스템 설정 따름' }
                        ].map((theme) => {
                          const Icon = theme.icon
                          return (
                            <button
                              key={theme.id}
                              onClick={() => setUserSettings(prev => ({ ...prev, theme: theme.id as any }))}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 hover-scale ${
                                userSettings.theme === theme.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Icon className={`w-8 h-8 mx-auto mb-2 ${
                                userSettings.theme === theme.id ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                              <div className="font-medium text-sm">{theme.label}</div>
                              <div className="text-xs text-gray-500">{theme.desc}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="language" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Globe className="w-4 h-4 text-purple-600" />
                          언어
                        </Label>
                        <select
                          id="language"
                          value={userSettings.language}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, language: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        >
                          <option value="ko">한국어</option>
                          <option value="en">English</option>
                          <option value="ja">日本語</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Clock className="w-4 h-4 text-purple-600" />
                          시간대
                        </Label>
                        <select
                          id="timezone"
                          value={userSettings.timezone}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        >
                          <option value="Asia/Seoul">서울 (GMT+9)</option>
                          <option value="Asia/Tokyo">도쿄 (GMT+9)</option>
                          <option value="America/New_York">뉴욕 (GMT-5)</option>
                          <option value="Europe/London">런던 (GMT+0)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={saveUserSettings}
                      disabled={saving}
                      className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-8"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'work' && (
              <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    작업 환경 설정
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">개인 작업 환경을 설정하세요</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="default_work_hours" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock className="w-4 h-4 text-orange-600" />
                        일일 기본 작업 시간
                      </Label>
                      <Input
                        id="default_work_hours"
                        type="number"
                        min="1"
                        max="24"
                        value={userSettings.work_preferences.default_work_hours}
                        onChange={(e) => setUserSettings(prev => ({
                          ...prev,
                          work_preferences: { ...prev.work_preferences, default_work_hours: parseInt(e.target.value) }
                        }))}
                        className="input-modern h-12"
                      />
                      <p className="text-xs text-gray-500">하루 기본 작업 시간 (시간)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="break_duration" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock className="w-4 h-4 text-orange-600" />
                        휴게 시간
                      </Label>
                      <Input
                        id="break_duration"
                        type="number"
                        min="0"
                        max="480"
                        value={userSettings.work_preferences.break_duration}
                        onChange={(e) => setUserSettings(prev => ({
                          ...prev,
                          work_preferences: { ...prev.work_preferences, break_duration: parseInt(e.target.value) }
                        }))}
                        className="input-modern h-12"
                      />
                      <p className="text-xs text-gray-500">일일 휴게 시간 (분)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_time" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock className="w-4 h-4 text-orange-600" />
                        업무 시작 시간
                      </Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={userSettings.work_preferences.start_time}
                        onChange={(e) => setUserSettings(prev => ({
                          ...prev,
                          work_preferences: { ...prev.work_preferences, start_time: e.target.value }
                        }))}
                        className="input-modern h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_time" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock className="w-4 h-4 text-orange-600" />
                        업무 종료 시간
                      </Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={userSettings.work_preferences.end_time}
                        onChange={(e) => setUserSettings(prev => ({
                          ...prev,
                          work_preferences: { ...prev.work_preferences, end_time: e.target.value }
                        }))}
                        className="input-modern h-12"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={saveUserSettings}
                      disabled={saving}
                      className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-8"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-red-600 rounded-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    보안 설정
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">계정 보안을 강화하세요</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Key className="w-5 h-5 text-red-600" />
                      비밀번호 변경
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">현재 비밀번호</Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                          className="input-modern h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new_password">새 비밀번호</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                          className="input-modern h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">새 비밀번호 확인</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                          className="input-modern h-12"
                        />
                      </div>

                      <Button 
                        onClick={changePassword}
                        disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                        className="btn-modern bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-medium hover:shadow-large h-12 px-8"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            변경 중...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-2" />
                            비밀번호 변경
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'organization' && allPermissions.canManageOrganizations && (
              <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-medium hover:shadow-large">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    조직 설정
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">조직 전체 설정을 관리하세요</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="default_currency">기본 통화</Label>
                      <select
                        id="default_currency"
                        value={orgSettings.default_currency}
                        onChange={(e) => setOrgSettings(prev => ({ ...prev, default_currency: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="KRW">🇰🇷 KRW (원)</option>
                        <option value="USD">🇺🇸 USD (달러)</option>
                        <option value="EUR">🇪🇺 EUR (유로)</option>
                        <option value="JPY">🇯🇵 JPY (엔)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project_code_format">프로젝트 코드 형식</Label>
                      <Input
                        id="project_code_format"
                        value={orgSettings.project_code_format}
                        onChange={(e) => setOrgSettings(prev => ({ ...prev, project_code_format: e.target.value }))}
                        placeholder="PRJ-{YYYY}-{###}"
                        className="input-modern h-12"
                      />
                      <p className="text-xs text-gray-500">{"{YYYY}: 연도, {###}: 순번"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-medium text-gray-800">자동 작업 배정</div>
                        <div className="text-sm text-gray-600">새 작업을 자동으로 팀원에게 배정</div>
                      </div>
                      <Switch
                        checked={orgSettings.auto_assign_tasks}
                        onCheckedChange={(checked) => setOrgSettings(prev => ({ ...prev, auto_assign_tasks: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-medium text-gray-800">시간 추적 필수</div>
                        <div className="text-sm text-gray-600">모든 작업에 시간 추적 필수</div>
                      </div>
                      <Switch
                        checked={orgSettings.require_time_tracking}
                        onCheckedChange={(checked) => setOrgSettings(prev => ({ ...prev, require_time_tracking: checked }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={saveOrganizationSettings}
                      disabled={saving}
                      className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-8"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}