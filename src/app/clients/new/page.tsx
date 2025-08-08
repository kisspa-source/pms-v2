'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loading } from '@/components/ui/loading'
import { ClientStatus } from '@/types/project'
import { ArrowLeft, Save, Building } from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import { useAlert } from '@/components/ui/alert-dialog'

export default function NewClientPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const { showAlert, AlertComponent } = useAlert()
  const [formData, setFormData] = useState({
    name: '',
    company_type: '',
    industry: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: '',
    status: ClientStatus.PROSPECT
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showAlert('클라이언트명을 입력해주세요.', 'warning')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '클라이언트 생성에 실패했습니다.')
      }

      const newClient = await response.json()
      router.push(`/clients/${newClient.id}`)
      
    } catch (error) {
      console.error('클라이언트 생성 오류:', error)
      showAlert(error instanceof Error ? error.message : '클라이언트 생성 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/clients">
              <Button variant="ghost">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">새 고객사 등록</h1>
              <p className="text-gray-600">새로운 고객사 정보를 입력하세요</p>
            </div>
          </div>

          {/* 폼 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                고객사 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      클라이언트명 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="클라이언트명을 입력하세요"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_type">
                      회사 유형
                    </Label>
                    <Input
                      id="company_type"
                      name="company_type"
                      value={formData.company_type}
                      onChange={handleInputChange}
                      placeholder="예: 주식회사, 유한회사"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">
                      산업 분야
                    </Label>
                    <Input
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="예: IT, 제조업, 금융"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      상태
                    </Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.values(ClientStatus).map(status => (
                        <option key={status} value={status}>
                          {status === ClientStatus.ACTIVE && '활성'}
                          {status === ClientStatus.INACTIVE && '비활성'}
                          {status === ClientStatus.PROSPECT && '잠재고객'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 연락처 정보 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">연락처 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_person">
                        담당자명
                      </Label>
                      <Input
                        id="contact_person"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        placeholder="담당자명을 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        이메일
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="이메일을 입력하세요"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        전화번호
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="전화번호를 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">
                        웹사이트
                      </Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* 추가 정보 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">추가 정보</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        주소
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="주소를 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">
                        메모
                      </Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="추가 메모를 입력하세요"
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Link href="/clients">
                    <Button variant="outline">
                      취소
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Alert Component */}
        <AlertComponent />
      </div>
    </MainLayout>
  )
}