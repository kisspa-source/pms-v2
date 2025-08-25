'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-lg',
  '2xl': 'w-20 h-20 text-2xl'
}

export function Avatar({ 
  src, 
  alt = 'Avatar', 
  fallback, 
  size = 'md', 
  className = '' 
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const showImage = src && !imageError && imageLoaded
  const showFallback = !src || imageError || !imageLoaded

  return (
    <div className={cn(
      'relative rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0',
      sizeClasses[size],
      className
    )}>
      {src && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full rounded-full object-cover transition-opacity duration-200',
            showImage ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
      
      {showFallback && (
        <span className={cn(
          'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
          showImage ? 'opacity-0' : 'opacity-100'
        )}>
          {fallback}
        </span>
      )}
    </div>
  )
}