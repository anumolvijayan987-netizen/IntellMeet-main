import React from 'react'
import { cn } from '../../utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      icon,
      iconRight,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#344054]"
          >
            {label}
          </label>
        )}

        <div className="relative rounded-lg shadow-subtle">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#667085]">
              {icon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#101828] placeholder-[#98A2B3] transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F8FAFC] disabled:text-[#98A2B3]',
              icon && 'pl-9',
              iconRight && 'pr-9',
              error
                ? 'border-[#FDA29B] focus:border-[#F04438] focus:ring-[#F04438]'
                : 'border-[#D0D5DD]',
              className
            )}
            {...props}
          />

          {iconRight && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#667085]">
              {iconRight}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-[#D92D20]">{error}</p>
        )}

        {!error && helperText && (
          <p className="text-xs text-[#667085]">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
