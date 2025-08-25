'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface MultiSelectOption {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = "선택하세요",
  className = "",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 옵션 선택/해제 핸들러
  const handleOptionToggle = (optionId: string) => {
    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];
    
    onChange(newSelectedIds);
  };

  // 모두 선택/해제
  const handleSelectAll = () => {
    if (selectedIds.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(option => option.id));
    }
  };

  // 선택된 항목들의 이름 가져오기
  const getSelectedNames = () => {
    return selectedIds
      .map(id => options.find(option => option.id === id)?.name)
      .filter(Boolean);
  };

  const selectedNames = getSelectedNames();
  const displayText = selectedNames.length === 0 
    ? placeholder
    : selectedNames.length === 1
      ? selectedNames[0]
      : `${selectedNames[0]} 외 ${selectedNames.length - 1}개`;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 드롭다운 버튼 */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-left font-normal"
      >
        <span className={selectedIds.length === 0 ? "text-gray-500" : "text-gray-900"}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* 모두 선택/해제 */}
          <div className="px-3 py-2 border-b border-gray-200">
            <button
              onClick={handleSelectAll}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              {selectedIds.length === options.length ? '모두 해제' : '모두 선택'}
            </button>
          </div>

          {/* 옵션 목록 */}
          {options.map((option) => (
            <div
              key={option.id}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
              onClick={() => handleOptionToggle(option.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => {}} // onClick에서 처리
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-900">{option.name}</span>
            </div>
          ))}

          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              선택할 수 있는 옵션이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}