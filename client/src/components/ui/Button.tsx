import React from 'react'
import { cn } from '../../utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'navy'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon,
  iconRight,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#2563EB] shadow-subtle hover:shadow',
    secondary:
      'bg-white hover:bg-[#F8FAFC] text-[#101828] border border-[#EAECF0] shadow-subtle hover:border-[#D0D5DD]',
    outline:
      'bg-transparent hover:bg-[#F8FAFC] text-[#344054] border border-[#D0D5DD]',
    danger:
      'bg-[#F04438] hover:bg-[#D92D20] text-white border border-[#F04438] shadow-subtle',
    ghost:
      'bg-transparent hover:bg-[#F2F4F7] text-[#475467] hover:text-[#101828]',
    navy:
      'bg-[#101828] hover:bg-[#182235] text-white border border-[#101828] shadow-subtle',
  }

  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5 font-medium',
    sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5 font-medium',
    md: 'text-sm px-4 py-2 rounded-lg gap-2 font-medium',
    lg: 'text-base px-5 py-2.5 rounded-lg gap-2 font-semibold',
  }

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  )
}
