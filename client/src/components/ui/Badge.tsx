import React from 'react'
import { cn } from '../../utils/cn'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'gray' | 'navy' | 'info' | 'purple'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  dot?: boolean
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  icon,
  dot,
  className,
}) => {
  const variantStyles = {
    primary: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
    info: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
    purple: 'bg-[#F9F5FF] text-[#6941C6] border-[#E9D7FE]',
    success: 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]',
    warning: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
    error: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
    gray: 'bg-[#F8FAFC] text-[#344054] border-[#EAECF0]',
    navy: 'bg-[#101828] text-white border-[#101828]',
  }

  const dotColors = {
    primary: 'bg-[#2563EB]',
    info: 'bg-[#2563EB]',
    purple: 'bg-[#7F56D9]',
    success: 'bg-[#12B76A]',
    warning: 'bg-[#F79009]',
    error: 'bg-[#F04438]',
    gray: 'bg-[#667085]',
    navy: 'bg-white',
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
