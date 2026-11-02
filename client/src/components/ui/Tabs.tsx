import React from 'react'
import { cn } from '../../utils/cn'

export interface TabItem {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pills'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  if (variant === 'pills') {
    return (
      <div
        className={cn(
          'inline-flex p-1 bg-[#F2F4F7] border border-[#EAECF0] rounded-xl gap-1 text-xs font-medium text-[#667085]',
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all select-none',
                isActive
                  ? 'bg-white text-[#101828] font-semibold shadow-subtle'
                  : 'hover:text-[#101828]'
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-[#EFF8FF] text-[#175CD3]'
                      : 'bg-[#EAECF0] text-[#475467]'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex border-b border-[#EAECF0] gap-6 text-sm font-medium text-[#667085]',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 pb-3 border-b-2 -mb-px transition-colors select-none font-medium text-xs md:text-sm',
              isActive
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent hover:text-[#101828] hover:border-[#D0D5DD]'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold',
                  isActive
                    ? 'bg-[#EFF8FF] text-[#175CD3]'
                    : 'bg-[#F2F4F7] text-[#475467]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
