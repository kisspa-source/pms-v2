'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { input } from '@/components/ui/input';
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Star,
  MessageCircle,
  AtSign
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  phone?: string;
  location?: string;
  joinDate: string;
  skills: string[];
  projects: {
    id: string;
    name: string;
    role: string;
  }[];
  availability: 'available' | 'busy' | 'away' | 'offline';
  lastActive: string;
  rating: number;
}

interface TeamMemberSearchProps {
  onSelectMember?: (member: TeamMember) => void;
  onMentionMember?: (member: TeamMember) => void;
  projectId?: string;
}

export default function TeamMemberSearch({ 
  onSelectMember, 
  onMentionMember, 
  projectId 
}: TeamMemberSearchProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    role: '',
    department: '',
    availability: '',
    skill: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // 팀원 목록 조회
  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);

      const response = await fetch(`/api/team-members?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
        setFilteredMembers(data);
      }
    } catch (error) {
      console.error('팀원 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  // 검색 및 필터링
  useEffect(() => {
    let filtered = members;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 역할 필터링
    if (selectedFilters.role) {
      filtered = filtered.filter(member => member.role === selectedFilters.role);
    }

    // 부서 필터링
    if (selectedFilters.department) {
      filtered = filtered.filter(member => member.department === selectedFilters.department);
    }

    // 가용성 필터링
    if (selectedFilters.availability) {
      filtered = filtered.filter(member => member.availability === selectedFilters.availability);
    }

    // 스킬 필터링
    if (selectedFilters.skill) {
      filtered = filtered.filter(member => 
        member.skills.some(skill => skill === selectedFilters.skill)
      );
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, selectedFilters]);

  // 고유한 역할, 부서, 스킬 목록
  const roles = [...new Set(members.map(m => m.role))];
  const departments = [...new Set(members.map(m => m.department))];
  const skills = [...new Set(members.flatMap(m => m.skills))];

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-red-100 text-red-800';
      case 'away':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available':
        return '사용 가능';
      case 'busy':
        return '바쁨';
      case 'away':
        return '자리 비움';
      default:
        return '오프라인';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleMemberSelect = (member: TeamMember) => {
    if (onSelectMember) {
      onSelectMember(member);
    }
  };

  const handleMemberMention = (member: TeamMember) => {
    if (onMentionMember) {
      onMentionMember(member);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">로딩 중...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">팀원 검색</h3>
        
        {/* 검색 입력 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름, 이메일, 역할, 스킬로 검색..."
            className={`${input()} pl-10`}
          />
        </div>

        {/* 필터 토글 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="mb-4"
        >
          필터 {showFilters ? '숨기기' : '보이기'}
        </Button>

        {/* 필터 패널 */}
        {showFilters && (
          <Card className="p-4 mb-4 border-2 border-dashed border-gray-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">역할</label>
                <select
                  value={selectedFilters.role}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, role: e.target.value }))}
                  className={input()}
                >
                  <option value="">모든 역할</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">부서</label>
                <select
                  value={selectedFilters.department}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, department: e.target.value }))}
                  className={input()}
                >
                  <option value="">모든 부서</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">가용성</label>
                <select
                  value={selectedFilters.availability}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, availability: e.target.value }))}
                  className={input()}
                >
                  <option value="">모든 상태</option>
                  <option value="available">사용 가능</option>
                  <option value="busy">바쁨</option>
                  <option value="away">자리 비움</option>
                  <option value="offline">오프라인</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">스킬</label>
                <select
                  value={selectedFilters.skill}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, skill: e.target.value }))}
                  className={input()}
                >
                  <option value="">모든 스킬</option>
                  {skills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFilters({ role: '', department: '', availability: '', skill: '' })}
              >
                필터 초기화
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* 검색 결과 */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || Object.values(selectedFilters).some(Boolean) 
              ? '검색 결과가 없습니다.' 
              : '팀원이 없습니다.'}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-4">
              총 {filteredMembers.length}명의 팀원을 찾았습니다.
            </div>
            
            <div className="grid gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* 아바타 */}
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-medium">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(member.availability)}`}>
                            {getAvailabilityText(member.availability)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{member.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{member.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>입사일: {formatDate(member.joinDate)}</span>
                        </div>
                      </div>

                      {/* 스킬 */}
                      {member.skills.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {member.skills.map((skill) => (
                              <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 프로젝트 */}
                      {member.projects.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-1">참여 프로젝트</h5>
                          <div className="space-y-1">
                            {member.projects.map((project) => (
                              <div key={project.id} className="text-xs text-gray-600">
                                {project.name} ({project.role})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleMemberSelect(member)}
                        >
                          선택
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMemberMention(member)}
                        >
                          <AtSign className="w-3 h-3 mr-1" />
                          멘션
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`mailto:${member.email}`, '_blank')}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          메일
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
} 