'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  FolderOpen, 
  CheckSquare, 
  User, 
  ArrowRight,
  Loader2,
  Command,
  Clock,
  Star,
  Building2,
  Mail,
  Calendar,
  Filter,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchResult {
  id: string
  name?: string
  title?: string
  description?: string
  email?: string
  role?: string
  status?: string
  priority?: string
  project_name?: string
  type: 'project' | 'task' | 'user'
}

interface SearchResponse {
  projects: SearchResult[]
  tasks: SearchResult[]
  users: SearchResult[]
  total: number
  query: string
}

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const debouncedQuery = useDebounce(query, 300)

  const searchAPI = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
      console.log('Searching for:', searchQuery)
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=15`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Search results:', data)
        setResults(data)
      } else {
        const errorData = await response.json()
        console.error('Search API error:', errorData)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    searchAPI(debouncedQuery)
  }, [debouncedQuery, searchAPI])

  const handleResultClick = (result: SearchResult) => {
    let path = ''
    
    switch (result.type) {
      case 'project':
        path = `/projects/${result.id}`
        break
      case 'task':
        path = `/tasks/${result.id}`
        break
      case 'user':
        path = `/users/${result.id}`
        break
    }
    
    if (path) {
      router.push(path)
      onClose()
    }
  }

  const handleClose = () => {
    setQuery('')
    setResults(null)
    onClose()
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderOpen className="w-4 h-4 text-blue-500" />
      case 'task':
        return <CheckSquare className="w-4 h-4 text-green-500" />
      case 'user':
        return <User className="w-4 h-4 text-purple-500" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'completed':
      case 'done':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'on_hold':
      case 'review':
        return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'cancelled':
      case 'blocked':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'todo':
        return 'text-slate-700 bg-slate-50 border-slate-200'
      case 'planning':
        return 'text-purple-700 bg-purple-50 border-purple-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'pmo':
        return 'text-purple-700 bg-purple-50 border-purple-200'
      case 'pm':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'pl':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200'
      case 'developer':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'designer':
        return 'text-pink-700 bg-pink-50 border-pink-200'
      case 'consultant':
        return 'text-orange-700 bg-orange-50 border-orange-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const formatStatus = (status?: string) => {
    const statusMap: Record<string, string> = {
      'in_progress': '진행중',
      'completed': '완료',
      'on_hold': '보류',
      'cancelled': '취소',
      'todo': '할일',
      'review': '검토중',
      'done': '완료',
      'blocked': '차단됨',
      'planning': '계획중',
      'active': '활성'
    }
    return statusMap[status?.toLowerCase() || ''] || status
  }

  const formatPriority = (priority?: string) => {
    const priorityMap: Record<string, string> = {
      'high': '높음',
      'medium': '보통',
      'low': '낮음',
      'critical': '긴급'
    }
    return priorityMap[priority?.toLowerCase() || ''] || priority
  }

  const formatRole = (role?: string) => {
    const roleMap: Record<string, string> = {
      'PMO': 'PMO',
      'PM': '프로젝트 매니저',
      'PL': '프로젝트 리더',
      'DEVELOPER': '개발자',
      'DESIGNER': '디자이너',
      'CONSULTANT': '컨설턴트'
    }
    return roleMap[role || ''] || role
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="w-full max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">전역 검색</h2>
                <p className="text-sm text-gray-600">프로젝트, 작업, 팀원을 빠르게 찾아보세요</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Command className="w-3 h-3" />
              <span>Ctrl + K</span>
            </div>
          </div>
        </div>

        {/* 검색 입력 */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어를 입력하세요... (프로젝트명, 작업명, 팀원명)"
              className="pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" />
            )}
            {query && !loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        </div>

        {/* 검색 결과 영역 - 고정 높이 */}
        <div className="h-96 overflow-y-auto bg-gray-50">
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">무엇을 찾고 계신가요?</h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                프로젝트명, 작업 제목, 팀원 이름을 입력하여<br />
                원하는 정보를 빠르게 찾아보세요
              </p>
              
              {/* 검색 팁 */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <FolderOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">프로젝트</p>
                  <p className="text-xs text-gray-500">프로젝트명으로 검색</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <CheckSquare className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">작업</p>
                  <p className="text-xs text-gray-500">작업 제목으로 검색</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <User className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">팀원</p>
                  <p className="text-xs text-gray-500">이름, 이메일로 검색</p>
                </div>
              </div>
            </div>
          )}

          {query.trim() && query.length < 2 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-lg font-medium text-gray-700">최소 2글자 이상 입력해주세요</p>
              <p className="text-sm text-gray-500 mt-1">더 정확한 검색을 위해 조금 더 입력해주세요</p>
            </div>
          )}

          {results && results.total === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 text-center mb-4">
                '<span className="font-medium text-gray-700">{results.query}</span>'에 대한 검색 결과가 없습니다
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                <p className="text-sm text-blue-800 font-medium mb-2">검색 팁:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 다른 키워드로 시도해보세요</li>
                  <li>• 검색어를 줄여보세요</li>
                  <li>• 영문/한글을 바꿔서 검색해보세요</li>
                </ul>
              </div>
            </div>
          )}

          {results && results.total > 0 && (
            <div className="p-6 space-y-8">
              {/* 검색 결과 헤더 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">검색 결과</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {results.total}개
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  '<span className="font-medium text-gray-700">{results.query}</span>' 검색
                </div>
              </div>

              {/* 프로젝트 결과 */}
              {results.projects.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-900 flex items-center">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      프로젝트 ({results.projects.length})
                    </h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.projects.map((project) => (
                      <button
                        key={project.id}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-blue-50 group"
                        onClick={() => handleResultClick(project)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <h5 className="font-semibold text-gray-900 truncate group-hover:text-blue-700">
                                {project.name}
                              </h5>
                            </div>
                            {project.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {project.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2">
                              {project.status && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                                  {formatStatus(project.status)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 ml-4 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 작업 결과 */}
              {results.tasks.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-green-50 px-4 py-3 border-b border-green-100">
                    <h4 className="text-sm font-semibold text-green-900 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      작업 ({results.tasks.length})
                    </h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.tasks.map((task) => (
                      <button
                        key={task.id}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-green-50 group"
                        onClick={() => handleResultClick(task)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <h5 className="font-semibold text-gray-900 truncate group-hover:text-green-700">
                                {task.title}
                              </h5>
                            </div>
                            {task.project_name && (
                              <div className="flex items-center space-x-1 mb-2">
                                <Building2 className="w-3 h-3 text-blue-500" />
                                <span className="text-sm text-blue-600 font-medium">{task.project_name}</span>
                              </div>
                            )}
                            {task.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2">
                              {task.status && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                  {formatStatus(task.status)}
                                </span>
                              )}
                              {task.priority && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                  <Star className="w-3 h-3 mr-1" />
                                  {formatPriority(task.priority)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 ml-4 group-hover:text-green-500 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 사용자 결과 */}
              {results.users.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-900 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      팀원 ({results.users.length})
                    </h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.users.map((user) => (
                      <button
                        key={user.id}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-purple-50 group"
                        onClick={() => handleResultClick(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-semibold">
                                {user.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-gray-900 truncate group-hover:text-purple-700">
                                {user.name}
                              </h5>
                              <div className="flex items-center space-x-1 mt-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-600 truncate">{user.email}</span>
                              </div>
                              {user.role && (
                                <div className="mt-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                    {formatRole(user.role)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 ml-4 group-hover:text-purple-500 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        {results && results.total > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>총 {results.total}개 결과</span>
                {results.projects.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <FolderOpen className="w-3 h-3" />
                    <span>{results.projects.length}</span>
                  </span>
                )}
                {results.tasks.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <CheckSquare className="w-3 h-3" />
                    <span>{results.tasks.length}</span>
                  </span>
                )}
                {results.users.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{results.users.length}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <Clock className="w-3 h-3" />
                <span>실시간 검색</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}