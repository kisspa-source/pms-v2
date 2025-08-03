'use client';

import { useState, useRef, useEffect } from 'react';
import { input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AtSign, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  users: User[];
  onMention?: (userId: string, userName: string) => void;
}

export default function MentionInput({
  value,
  onChange,
  placeholder = '댓글을 입력하세요...',
  users,
  onMention,
}: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 멘션 필터링된 사용자 목록
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // @ 기호 감지 및 멘션 목록 표시
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);

    // @ 기호 뒤의 텍스트 찾기
    const beforeCursor = newValue.slice(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionFilter(mentionMatch[1]);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  // 멘션 선택
  const handleMentionSelect = (user: User) => {
    const beforeMention = value.slice(0, cursorPosition).replace(/@\w*$/, '');
    const afterMention = value.slice(cursorPosition);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    
    onChange(newValue);
    setShowMentions(false);
    
    // 멘션 콜백 호출
    if (onMention) {
      onMention(user.id, user.name);
    }

    // 커서 위치 조정
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + user.name.length + 2; // @ + space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
      } else if (e.key === 'Enter' && filteredUsers.length > 0) {
        e.preventDefault();
        handleMentionSelect(filteredUsers[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  // 멘션 텍스트 하이라이트
  const renderHighlightedText = (text: string, filter: string) => {
    if (!filter) return text;
    
    const regex = new RegExp(`(${filter})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={input()}
        placeholder={placeholder}
        rows={3}
      />

      {/* 멘션 목록 */}
      {showMentions && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto z-50 shadow-lg">
          <div className="p-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                사용자를 찾을 수 없습니다.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user, index) => (
                  <button
                    key={user.id}
                    onClick={() => handleMentionSelect(user)}
                    className={`w-full text-left p-2 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                      index === selectedMentionIndex ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {renderHighlightedText(user.name, mentionFilter)}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                    </div>
                    <AtSign className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 멘션 도움말 */}
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
        <AtSign className="w-3 h-3" />
        <span>@를 입력하여 사용자를 멘션할 수 있습니다.</span>
      </div>
    </div>
  );
} 