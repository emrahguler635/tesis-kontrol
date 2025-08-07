import React, { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  // Eğer className'de bg- ile başlayan bir renk varsa, varsayılan beyaz arka planı kaldır
  const hasCustomBg = className.includes('bg-');
  const baseClasses = hasCustomBg 
    ? 'rounded-lg shadow-sm border border-gray-200 p-6' 
    : 'bg-white rounded-lg shadow-sm border border-gray-200 p-6';
  
  return (
    <div 
      className={`${baseClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
} 