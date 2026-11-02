import React from 'react'
import { cn } from '../../utils/cn'

export interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed border-[#D0D5DD] bg-[#F8FAFC]',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-white border border-[#EAECF0] shadow-subtle flex items-center justify-center text-[#2563EB] mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#101828] font-heading">{title}</h3>
      <p className="text-xs text-[#667085] mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
