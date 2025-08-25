'use client'

import { useState, useEffect, useCallback } from 'react'

export function useGlobalSearch() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K 또는 Cmd+K로 검색 모달 열기
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        openSearch()
      }
      
      // ESC로 검색 모달 닫기
      if (event.key === 'Escape' && isSearchOpen) {
        closeSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchOpen, openSearch, closeSearch])

  return {
    isSearchOpen,
    openSearch,
    closeSearch
  }
}