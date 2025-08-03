'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus,
  Calendar,
  Tag
} from 'lucide-react';

interface Decision {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  votes: {
    userId: string;
    userName: string;
    vote: 'approve' | 'reject' | 'abstain';
    comment?: string;
    timestamp: string;
  }[];
  finalDecision?: {
    decision: 'approved' | 'rejected';
    decidedBy: string;
    decidedAt: string;
    reason?: string;
  };
}

interface DecisionHistoryProps {
  projectId?: string;
  taskId?: string;
}

export default function DecisionHistory({ projectId, taskId }: DecisionHistoryProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newDecision, setNewDecision] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    tags: '',
  });

  // 의사결정 목록 조회
  const fetchDecisions = async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (taskId) params.append('taskId', taskId);

      const response = await fetch(`/api/decisions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDecisions(data);
      }
    } catch (error) {
      console.error('의사결정 조회 오류:', error);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [projectId, taskId]);

  // 새 의사결정 생성
  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newDecision,
          projectId,
          taskId,
          tags: newDecision.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setNewDecision({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          tags: '',
        });
        setShowForm(false);
        fetchDecisions();
      }
    } catch (error) {
      console.error('의사결정 생성 오류:', error);
    }
  };

  // 투표
  const handleVote = async (decisionId: string, vote: 'approve' | 'reject' | 'abstain', comment?: string) => {
    try {
      const response = await fetch(`/api/decisions/${decisionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote, comment }),
      });

      if (response.ok) {
        fetchDecisions();
      }
    } catch (error) {
      console.error('투표 오류:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'under_review':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">의사결정 히스토리</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          새 의사결정
        </Button>
      </div>

      {/* 새 의사결정 폼 */}
      {showForm && (
        <Card className="p-4 mb-6 border-2 border-dashed border-gray-300">
          <form onSubmit={handleCreateDecision} className="space-y-4">
            <div>
              <Label>제목</Label>
              <input
                type="text"
                value={newDecision.title}
                onChange={(e) => setNewDecision(prev => ({ ...prev, title: e.target.value }))}
                className={input()}
                required
              />
            </div>
            
            <div>
              <Label>설명</Label>
              <textarea
                value={newDecision.description}
                onChange={(e) => setNewDecision(prev => ({ ...prev, description: e.target.value }))}
                className={input()}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>우선순위</Label>
                <select
                  value={newDecision.priority}
                  onChange={(e) => setNewDecision(prev => ({ ...prev, priority: e.target.value as any }))}
                  className={input()}
                >
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>
              
              <div>
                <Label>마감일</Label>
                <input
                  type="date"
                  value={newDecision.dueDate}
                  onChange={(e) => setNewDecision(prev => ({ ...prev, dueDate: e.target.value }))}
                  className={input()}
                />
              </div>
            </div>

            <div>
              <Label>태그 (쉼표로 구분)</Label>
              <input
                type="text"
                value={newDecision.tags}
                onChange={(e) => setNewDecision(prev => ({ ...prev, tags: e.target.value }))}
                className={input()}
                placeholder="예: UI, 백엔드, 보안"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">의사결정 생성</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 의사결정 목록 */}
      <div className="space-y-4">
        {decisions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 의사결정이 없습니다.
          </div>
        ) : (
          decisions.map((decision) => (
            <Card key={decision.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(decision.status)}
                  <h4 className="font-medium">{decision.title}</h4>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(decision.status)}`}>
                    {decision.status === 'pending' && '대기중'}
                    {decision.status === 'approved' && '승인됨'}
                    {decision.status === 'rejected' && '거부됨'}
                    {decision.status === 'under_review' && '검토중'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(decision.priority)}`}>
                    {decision.priority === 'low' && '낮음'}
                    {decision.priority === 'medium' && '보통'}
                    {decision.priority === 'high' && '높음'}
                    {decision.priority === 'urgent' && '긴급'}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 mb-3">{decision.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{decision.createdBy.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(decision.createdAt)}</span>
                </div>
                {decision.dueDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>마감: {formatDate(decision.dueDate)}</span>
                  </div>
                )}
              </div>

              {/* 태그 */}
              {decision.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {decision.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 투표 결과 */}
              {decision.votes.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium mb-2">투표 결과</h5>
                  <div className="space-y-1">
                    {decision.votes.map((vote) => (
                      <div key={vote.userId} className="flex items-center justify-between text-sm">
                        <span>{vote.userName}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            vote.vote === 'approve' ? 'bg-green-100 text-green-800' :
                            vote.vote === 'reject' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {vote.vote === 'approve' && '승인'}
                            {vote.vote === 'reject' && '거부'}
                            {vote.vote === 'abstain' && '기권'}
                          </span>
                          {vote.comment && (
                            <span className="text-gray-500 text-xs">"{vote.comment}"</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 최종 결정 */}
              {decision.finalDecision && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium mb-1">최종 결정</h5>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(decision.finalDecision.decision)}
                    <span className="text-sm">
                      {decision.finalDecision.decision === 'approved' ? '승인' : '거부'}
                    </span>
                    <span className="text-xs text-gray-500">
                      by {decision.finalDecision.decidedBy} on {formatDate(decision.finalDecision.decidedAt)}
                    </span>
                  </div>
                  {decision.finalDecision.reason && (
                    <p className="text-sm text-gray-600 mt-1">
                      사유: {decision.finalDecision.reason}
                    </p>
                  )}
                </div>
              )}

              {/* 투표 버튼 (대기중인 경우만) */}
              {decision.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleVote(decision.id, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    승인
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(decision.id, 'reject')}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    거부
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(decision.id, 'abstain')}
                  >
                    기권
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </Card>
  );
} 