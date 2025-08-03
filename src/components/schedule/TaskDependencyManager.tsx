'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  status: string;
  start_date: Date | null;
  due_date: Date | null;
  assignee?: string;
}

interface TaskDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
  lag_days: number;
}

interface TaskDependencyManagerProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onDependencyAdd: (dependency: Omit<TaskDependency, 'id'>) => void;
  onDependencyRemove: (dependencyId: string) => void;
  onDependencyUpdate: (dependencyId: string, updates: Partial<TaskDependency>) => void;
}

export const TaskDependencyManager: React.FC<TaskDependencyManagerProps> = ({
  tasks,
  dependencies,
  onDependencyAdd,
  onDependencyRemove,
  onDependencyUpdate
}) => {
  const [selectedPredecessor, setSelectedPredecessor] = useState<string>('');
  const [selectedSuccessor, setSelectedSuccessor] = useState<string>('');
  const [dependencyType, setDependencyType] = useState<TaskDependency['dependency_type']>('FINISH_TO_START');
  const [lagDays, setLagDays] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);

  // 의존성 타입 옵션
  const dependencyTypes = [
    { value: 'FINISH_TO_START', label: '완료-시작 (FS)', description: '선행 작업 완료 후 후행 작업 시작' },
    { value: 'START_TO_START', label: '시작-시작 (SS)', description: '선행 작업 시작 후 후행 작업 시작' },
    { value: 'FINISH_TO_FINISH', label: '완료-완료 (FF)', description: '선행 작업 완료 후 후행 작업 완료' },
    { value: 'START_TO_FINISH', label: '시작-완료 (SF)', description: '선행 작업 시작 후 후행 작업 완료' }
  ];

  // 순환 의존성 검사
  const checkCircularDependency = (predecessorId: string, successorId: string): boolean => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recursionStack.add(taskId);

      const successors = dependencies
        .filter(d => d.predecessor_id === taskId)
        .map(d => d.successor_id);

      for (const successor of successors) {
        if (hasCycle(successor)) return true;
      }

      recursionStack.delete(taskId);
      return false;
    };

    // 임시로 의존성 추가
    const tempDependency = { predecessor_id: predecessorId, successor_id: successorId };
    const tempDependencies = [...dependencies, tempDependency];
    
    return hasCycle(successorId);
  };

  // 의존성 추가
  const handleAddDependency = () => {
    if (!selectedPredecessor || !selectedSuccessor) {
      alert('선행 작업과 후행 작업을 모두 선택해주세요.');
      return;
    }

    if (selectedPredecessor === selectedSuccessor) {
      alert('같은 작업을 선행/후행으로 설정할 수 없습니다.');
      return;
    }

    // 기존 의존성 확인
    const existingDependency = dependencies.find(
      d => d.predecessor_id === selectedPredecessor && d.successor_id === selectedSuccessor
    );

    if (existingDependency) {
      alert('이미 존재하는 의존성입니다.');
      return;
    }

    // 순환 의존성 검사
    if (checkCircularDependency(selectedPredecessor, selectedSuccessor)) {
      alert('순환 의존성이 감지되었습니다. 다른 의존성을 선택해주세요.');
      return;
    }

    onDependencyAdd({
      predecessor_id: selectedPredecessor,
      successor_id: selectedSuccessor,
      dependency_type: dependencyType,
      lag_days: lagDays
    });

    // 폼 초기화
    setSelectedPredecessor('');
    setSelectedSuccessor('');
    setDependencyType('FINISH_TO_START');
    setLagDays(0);
    setShowAddForm(false);
  };

  // 작업별 의존성 정보
  const getTaskDependencies = (taskId: string) => {
    const predecessors = dependencies.filter(d => d.successor_id === taskId);
    const successors = dependencies.filter(d => d.predecessor_id === taskId);
    return { predecessors, successors };
  };

  // 의존성 타입 레이블
  const getDependencyTypeLabel = (type: string) => {
    const found = dependencyTypes.find(dt => dt.value === type);
    return found ? found.label : type;
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">작업 의존성 관리</h3>
        <p className="text-sm text-gray-600 mb-4">
          작업 간의 의존성을 설정하여 프로젝트 일정을 관리합니다.
        </p>
      </div>

      {/* 의존성 추가 폼 */}
      <div className="mb-6">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mb-4"
        >
          {showAddForm ? '의존성 추가 취소' : '새 의존성 추가'}
        </Button>

        {showAddForm && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">새 의존성 추가</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  선행 작업 (완료되어야 하는 작업)
                </label>
                <select
                  value={selectedPredecessor}
                  onChange={(e) => setSelectedPredecessor(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선행 작업 선택</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.assignee || '미배정'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  후행 작업 (시작할 작업)
                </label>
                <select
                  value={selectedSuccessor}
                  onChange={(e) => setSelectedSuccessor(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">후행 작업 선택</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.assignee || '미배정'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  의존성 타입
                </label>
                <select
                  value={dependencyType}
                  onChange={(e) => setDependencyType(e.target.value as TaskDependency['dependency_type'])}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {dependencyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {dependencyTypes.find(t => t.value === dependencyType)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지연일수 (Lag Days)
                </label>
                <input
                  type="number"
                  value={lagDays}
                  onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  의존성 완료 후 추가로 대기할 일수
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddDependency} className="bg-blue-500 hover:bg-blue-600">
                의존성 추가
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                취소
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 의존성 목록 */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">현재 의존성 목록</h4>
        {dependencies.length === 0 ? (
          <p className="text-gray-500 text-center py-4">설정된 의존성이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {dependencies.map((dependency) => {
              const predecessor = tasks.find(t => t.id === dependency.predecessor_id);
              const successor = tasks.find(t => t.id === dependency.successor_id);

              return (
                <div key={dependency.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{predecessor?.title}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-sm">{successor?.title}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        타입: {getDependencyTypeLabel(dependency.dependency_type)}
                        {dependency.lag_days > 0 && ` | 지연: ${dependency.lag_days}일`}
                      </div>
                    </div>
                    <Button
                      onClick={() => onDependencyRemove(dependency.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 작업별 의존성 요약 */}
      <div>
        <h4 className="font-medium mb-3">작업별 의존성 요약</h4>
        <div className="space-y-3">
          {tasks.map(task => {
            const { predecessors, successors } = getTaskDependencies(task.id);
            
            return (
              <div key={task.id} className="border rounded-lg p-3 bg-white">
                <div className="font-medium text-sm mb-2">{task.title}</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">선행 작업:</span>
                    <div className="mt-1">
                      {predecessors.length === 0 ? (
                        <span className="text-gray-400">없음</span>
                      ) : (
                        predecessors.map(dep => {
                          const pred = tasks.find(t => t.id === dep.predecessor_id);
                          return (
                            <div key={dep.id} className="text-blue-600">
                              • {pred?.title}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">후행 작업:</span>
                    <div className="mt-1">
                      {successors.length === 0 ? (
                        <span className="text-gray-400">없음</span>
                      ) : (
                        successors.map(dep => {
                          const succ = tasks.find(t => t.id === dep.successor_id);
                          return (
                            <div key={dep.id} className="text-green-600">
                              • {succ?.title}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}; 