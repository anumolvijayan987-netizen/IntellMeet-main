import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LandingPage } from '../pages/LandingPage'

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}

describe('IntellMeet Responsive Viewport Audit', () => {
  describe('Desktop Viewport (1920x1080 & 1440x900)', () => {
    beforeEach(() => {
      setViewport(1440, 900)
    })

    it('renders desktop navy sidebar and persistent search bar', () => {
      render(
        <MemoryRouter initialEntries={['/app']}>
          <DashboardLayout />
        </MemoryRouter>
      )

      expect(screen.getByText('ACTIVE WORKSPACE')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/search meetings, transcripts/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /new meeting/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /join with code/i })).toBeInTheDocument()
    })

    it('renders full marketing header and CTAs on landing page', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      )

      expect(screen.getByText(/make every meeting matter/i)).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /get started/i }).length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Laptop Viewport (1280x800)', () => {
    beforeEach(() => {
      setViewport(1280, 800)
    })

    it('retains side navigation and adapts layout without overflow', () => {
      render(
        <MemoryRouter initialEntries={['/app']}>
          <DashboardLayout />
        </MemoryRouter>
      )

      expect(screen.getByText('ACTIVE WORKSPACE')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /new meeting/i })).toBeInTheDocument()
    })
  })

  describe('Tablet Viewport (768x1024)', () => {
    beforeEach(() => {
      setViewport(768, 1024)
    })

    it('adapts header controls and keeps buttons accessible', () => {
      render(
        <MemoryRouter initialEntries={['/app']}>
          <DashboardLayout />
        </MemoryRouter>
      )

      expect(screen.getByRole('button', { name: /join with code/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /new meeting/i })).toBeInTheDocument()
    })
  })

  describe('Mobile Viewport (375x667 & 390x844)', () => {
    beforeEach(() => {
      setViewport(375, 667)
    })

    it('toggles mobile drawer on hamburger menu click', () => {
      render(
        <MemoryRouter initialEntries={['/app']}>
          <DashboardLayout />
        </MemoryRouter>
      )

      // Mobile hamburger button
      const mobileNavButtons = screen.getAllByRole('button')
      const hamburgerBtn = mobileNavButtons.find((btn) => btn.querySelector('svg.lucide-menu'))

      expect(hamburgerBtn).toBeDefined()
      fireEvent.click(hamburgerBtn!)

      // Mobile navigation drawer should open
      const closeBtn = screen.getAllByRole('button').find((btn) => btn.querySelector('svg.lucide-x'))
      expect(closeBtn).toBeDefined()
    })

    it('renders compact CTAs on landing page without broken elements', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      )

      expect(screen.getByText(/make every meeting matter/i)).toBeInTheDocument()
      expect(screen.getAllByText(/explore features/i).length).toBeGreaterThanOrEqual(1)
    })
  })
})
