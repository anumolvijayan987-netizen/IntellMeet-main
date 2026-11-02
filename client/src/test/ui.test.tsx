import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ToastProvider, useToast } from '../contexts/ToastContext'

describe('IntellMeet UI Component Library', () => {
  describe('Button Component', () => {
    it('renders with children text and primary styling by default', () => {
      render(<Button>Click Me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-[#2563EB]')
    })

    it('renders secondary variant correctly with white background', () => {
      render(<Button variant="secondary">Secondary Action</Button>)
      const button = screen.getByRole('button', { name: /secondary action/i })
      expect(button).toHaveClass('bg-white')
    })

    it('handles click events', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Trigger Event</Button>)
      fireEvent.click(screen.getByRole('button', { name: /trigger event/i }))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('supports loading state and disables interaction', () => {
      render(<Button loading>Processing</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Badge Component', () => {
    it('renders success badge with green styles', () => {
      render(<Badge variant="success">Completed</Badge>)
      const textSpan = screen.getByText('Completed')
      const badgeContainer = textSpan.parentElement
      expect(badgeContainer).toBeInTheDocument()
      expect(badgeContainer).toHaveClass('bg-[#ECFDF3]')
    })

    it('renders error badge with red styles', () => {
      render(<Badge variant="error">High Priority</Badge>)
      const textSpan = screen.getByText('High Priority')
      const badgeContainer = textSpan.parentElement
      expect(badgeContainer).toHaveClass('bg-[#FEF3F2]')
    })

    it('renders warning badge with orange styles', () => {
      render(<Badge variant="warning">Medium</Badge>)
      const textSpan = screen.getByText('Medium')
      const badgeContainer = textSpan.parentElement
      expect(badgeContainer).toHaveClass('bg-[#FFFAEB]')
    })
  })

  describe('Card Component', () => {
    it('renders content inside elevated card container', () => {
      render(
        <Card className="custom-card">
          <p>Card Internal Content</p>
        </Card>
      )
      expect(screen.getByText('Card Internal Content')).toBeInTheDocument()
      const card = screen.getByText('Card Internal Content').closest('div')
      expect(card).toHaveClass('bg-white')
      expect(card).toHaveClass('custom-card')
    })
  })

  describe('Input Component', () => {
    it('renders with label and captures text changes', () => {
      const handleChange = vi.fn()
      render(
        <Input
          label="Meeting Topic"
          placeholder="Enter title"
          onChange={handleChange}
        />
      )
      expect(screen.getByText('Meeting Topic')).toBeInTheDocument()
      const input = screen.getByPlaceholderText('Enter title')
      fireEvent.change(input, { target: { value: 'Sprint Q4 Review' } })
      expect(handleChange).toHaveBeenCalled()
    })

    it('displays validation error message when passed', () => {
      render(<Input label="Work Email" error="Invalid email address" />)
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })
  })

  describe('ConfirmDialog Component', () => {
    it('renders when isOpen is true and fires confirm callback', () => {
      const handleConfirm = vi.fn()
      const handleClose = vi.fn()

      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Workspace"
          description="Are you sure you want to permanently delete this workspace?"
          confirmText="Delete"
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )

      expect(screen.getByText('Delete Workspace')).toBeInTheDocument()
      expect(screen.getAllByText('Are you sure you want to permanently delete this workspace?').length).toBeGreaterThanOrEqual(1)

      const deleteBtn = screen.getByRole('button', { name: 'Delete' })
      fireEvent.click(deleteBtn)
      expect(handleConfirm).toHaveBeenCalledTimes(1)
    })
  })

  describe('Toast Notification System', () => {
    const TestToastComponent = () => {
      const { success, error } = useToast()
      return (
        <div>
          <button onClick={() => success('Operation successful!', 'Success Title')}>
            Show Success Toast
          </button>
          <button onClick={() => error('Something went wrong', 'Error Title')}>
            Show Error Toast
          </button>
        </div>
      )
    }

    it('renders success and error toasts through ToastProvider', () => {
      render(
        <ToastProvider>
          <TestToastComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByRole('button', { name: /show success toast/i }))
      expect(screen.getByText('Success Title')).toBeInTheDocument()
      expect(screen.getByText('Operation successful!')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /show error toast/i }))
      expect(screen.getByText('Error Title')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })
})
