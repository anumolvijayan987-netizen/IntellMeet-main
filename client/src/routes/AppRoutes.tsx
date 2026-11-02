import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

// Eager load LandingPage for instant first contentful paint (FCP)
import { LandingPage } from '../pages/LandingPage'
import { DashboardLayout } from '../layouts/DashboardLayout'

// Lazy-loaded routes for code splitting
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })))
const OnboardingPage = lazy(() => import('../pages/auth/OnboardingPage').then((m) => ({ default: m.OnboardingPage })))

const OverviewPage = lazy(() => import('../pages/dashboard/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const MyMeetingsPage = lazy(() => import('../pages/dashboard/MyMeetingsPage').then((m) => ({ default: m.MyMeetingsPage })))
const ScheduleMeetingPage = lazy(() => import('../pages/dashboard/ScheduleMeetingPage').then((m) => ({ default: m.ScheduleMeetingPage })))
const CalendarPage = lazy(() => import('../pages/dashboard/CalendarPage').then((m) => ({ default: m.CalendarPage })))
const HistoryPage = lazy(() => import('../pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const WorkspacePage = lazy(() => import('../pages/dashboard/WorkspacePage').then((m) => ({ default: m.WorkspacePage })))
const AiInsightsPage = lazy(() => import('../pages/dashboard/AiInsightsPage').then((m) => ({ default: m.AiInsightsPage })))
const TasksPage = lazy(() => import('../pages/dashboard/TasksPage').then((m) => ({ default: m.TasksPage })))
const RecordingsPage = lazy(() => import('../pages/dashboard/RecordingsPage').then((m) => ({ default: m.RecordingsPage })))
const SettingsPage = lazy(() => import('../pages/dashboard/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const MeetingRoomPage = lazy(() => import('../pages/meeting/MeetingRoomPage').then((m) => ({ default: m.MeetingRoomPage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-3 p-8">
    <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
    <span className="text-xs font-medium text-[#667085]">Loading view...</span>
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 1. Public Marketing Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Authentication Flow */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<Navigate to="/app" replace />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* 3. Real-Time Dark Meeting Room */}
        <Route path="/room/:roomId" element={<MeetingRoomPage />} />

        {/* 4. Enterprise Light Dashboard */}
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="meetings" element={<MyMeetingsPage />} />
          <Route path="schedule" element={<ScheduleMeetingPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="workspace" element={<WorkspacePage />} />
          <Route path="insights" element={<AiInsightsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="recordings" element={<RecordingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Legacy / Direct shortcuts */}
        <Route path="/history" element={<Navigate to="/app/history" replace />} />
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />

        {/* 5. 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
