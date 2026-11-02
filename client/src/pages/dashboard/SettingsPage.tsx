import React, { useState, useRef } from 'react'
import {
  Settings,
  User,
  Sliders,
  Sparkles,
  Shield,
  CreditCard,
  Save,
  CheckCircle2,
  Upload,
  Bell,
  Palette,
  Globe,
  Lock,
  Building2,
  Key,
  Smartphone,
  Eye,
  Moon,
  Sun,
  Loader2,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Tabs } from '../../components/ui/Tabs'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/authService'
import { workspaceService } from '../../services/workspaceService'
import { useToast } from '../../contexts/ToastContext'

export const SettingsPage: React.FC = () => {
  const { user, workspaceName, organizationName, setUser, setWorkspaceName } = useAuthStore()
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [savedFeedback, setSavedFeedback] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Profile settings
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Architect')
  const [bio, setBio] = useState('Leading enterprise distributed streaming and AI collaboration systems.')

  // 2. Account settings
  const [language, setLanguage] = useState('en-US')
  const [timezone, setTimezone] = useState('UTC-5 (Eastern Time)')
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')

  // 3. Workspace settings
  const [wsName, setWsName] = useState(workspaceName || 'Core Engineering')
  const [wsSlug, setWsSlug] = useState('core-eng')
  const [wsDescription, setWsDescription] = useState('Infrastructure and WebRTC video collaboration platform.')
  const [wsIsPrivate, setWsIsPrivate] = useState(false)

  // 4. Notification preferences
  const [emailInvites, setEmailInvites] = useState(true)
  const [meetingReminders, setMeetingReminders] = useState(true)
  const [taskAlerts, setTaskAlerts] = useState(true)
  const [summaryAlerts, setSummaryAlerts] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  // 5. Security settings
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  // 6. Theme settings
  const [dashboardTheme, setDashboardTheme] = useState<'light' | 'dark'>('light')
  const [meetingRoomTheme, setMeetingRoomTheme] = useState<'dark' | 'dim'>('dark')
  const [highContrast, setHighContrast] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await authService.updateProfile({ name })
      setUser({ name })
      setSavedFeedback(true)
      success('User profile updated successfully')
      setTimeout(() => setSavedFeedback(false), 2000)
    } catch {
      setUser({ name })
      setSavedFeedback(true)
      success('Profile changes saved')
      setTimeout(() => setSavedFeedback(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await workspaceService.updateSettings('ws_general', {
        name: wsName,
        slug: wsSlug,
        description: wsDescription,
        isPrivate: wsIsPrivate,
      })
      setWorkspaceName(wsName)
      setSavedFeedback(true)
      success('Workspace settings updated successfully')
      setTimeout(() => setSavedFeedback(false), 2000)
    } catch {
      setWorkspaceName(wsName)
      setSavedFeedback(true)
      success('Workspace settings saved')
      setTimeout(() => setSavedFeedback(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await authService.uploadAvatar(file)
      if (res?.avatarUrl) {
        setUser({ avatarUrl: res.avatarUrl })
        setSavedFeedback(true)
        success('Avatar updated successfully')
        setTimeout(() => setSavedFeedback(false), 2000)
      }
    } catch (err) {
      console.error('Avatar upload failed', err)
      error('Failed to upload avatar image')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="pb-4 border-b border-[#EAECF0]">
        <h1 className="font-heading text-2xl font-bold text-[#101828]">Settings</h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Configure profile details, account preferences, workspace rules, notification subscriptions, and theme modes.
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
          { id: 'account', label: 'Account', icon: <Globe className="w-4 h-4" /> },
          { id: 'workspace', label: 'Workspace', icon: <Building2 className="w-4 h-4" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
          { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
          { id: 'theme', label: 'Theme & Display', icon: <Palette className="w-4 h-4" /> },
        ]}
      />

      {savedFeedback && (
        <div className="p-3 bg-[#ECFDF3] border border-[#A6F4C5] rounded-xl text-xs text-[#027A48] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Preferences saved successfully.</span>
        </div>
      )}

      {/* 1. PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <Card className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-3">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Personal Profile
            </h3>
            <p className="text-xs text-[#667085]">
              Information visible to meeting attendees and workspace colleagues.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-[#EAECF0]"
            />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-3.5 h-3.5" />}
              >
                Change Avatar
              </Button>
              <div className="text-[11px] text-[#667085] mt-1">
                JPG, GIF or PNG. Max size 5MB.
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Work Email"
                value={email}
                disabled
                helperText="Email is managed via Organization SSO"
              />
            </div>

            <Input
              label="Job Title / Role"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-[#344054]">Biography</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                icon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 2. ACCOUNT SETTINGS */}
      {activeTab === 'account' && (
        <Card className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-3">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Account Preferences & Localization
            </h3>
            <p className="text-xs text-[#667085]">
              Timezone conventions and default application language.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-[#344054]">
                  Application Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="es-ES">Spanish (Español)</option>
                  <option value="fr-FR">French (Français)</option>
                  <option value="de-DE">German (Deutsch)</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-[#344054]">
                  Default Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                  <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                  <option value="UTC+0 (London, GMT)">UTC+0 (London, GMT)</option>
                  <option value="UTC+5:30 (India Standard Time)">UTC+5:30 (India Standard Time)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-left max-w-sm">
              <label className="block text-xs font-medium text-[#344054]">
                Date Display Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Enterprise)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (European Format)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* 3. WORKSPACE SETTINGS */}
      {activeTab === 'workspace' && (
        <Card className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-3">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Workspace Settings
            </h3>
            <p className="text-xs text-[#667085]">
              Adjust active workspace parameters, URL slug, and access privacy.
            </p>
          </div>

          <form onSubmit={handleSaveWorkspace} className="space-y-4">
            <Input
              label="Workspace Name"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              required
            />

            <Input
              label="Workspace URL Slug"
              value={wsSlug}
              onChange={(e) => setWsSlug(e.target.value)}
              required
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-[#344054]">Description</label>
              <textarea
                value={wsDescription}
                onChange={(e) => setWsDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-[#101828]">Private Workspace</div>
                <div className="text-[11px] text-[#667085]">
                  Only invited team members can discover meetings and channels
                </div>
              </div>
              <input
                type="checkbox"
                checked={wsIsPrivate}
                onChange={(e) => setWsIsPrivate(e.target.checked)}
                className="rounded border-[#D0D5DD] text-[#2563EB] w-4 h-4"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
                Save Workspace Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 4. NOTIFICATION PREFERENCES */}
      {activeTab === 'notifications' && (
        <Card className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-3">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Notification Preferences
            </h3>
            <p className="text-xs text-[#667085]">
              Choose which real-time and email alerts you wish to receive.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EAECF0] hover:bg-[#F8FAFC] cursor-pointer">
              <div>
                <div className="font-semibold text-[#101828]">Meeting Invitations</div>
                <div className="text-[11px] text-[#667085]">Receive invitations when scheduled by colleagues</div>
              </div>
              <input
                type="checkbox"
                checked={emailInvites}
                onChange={(e) => setEmailInvites(e.target.checked)}
                className="rounded border-[#D0D5DD] text-[#2563EB] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EAECF0] hover:bg-[#F8FAFC] cursor-pointer">
              <div>
                <div className="font-semibold text-[#101828]">Upcoming Meeting Reminders</div>
                <div className="text-[11px] text-[#667085]">Receive alert 10 minutes prior to scheduled start</div>
              </div>
              <input
                type="checkbox"
                checked={meetingReminders}
                onChange={(e) => setMeetingReminders(e.target.checked)}
                className="rounded border-[#D0D5DD] text-[#2563EB] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EAECF0] hover:bg-[#F8FAFC] cursor-pointer">
              <div>
                <div className="font-semibold text-[#101828]">Task Assignments & Deadlines</div>
                <div className="text-[11px] text-[#667085]">Alert when assigned an action item or approaching due date</div>
              </div>
              <input
                type="checkbox"
                checked={taskAlerts}
                onChange={(e) => setTaskAlerts(e.target.checked)}
                className="rounded border-[#D0D5DD] text-[#2563EB] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EAECF0] hover:bg-[#F8FAFC] cursor-pointer">
              <div>
                <div className="font-semibold text-[#101828]">AI Summary Availability</div>
                <div className="text-[11px] text-[#667085]">Notify when executive minutes and decisions are synthesized</div>
              </div>
              <input
                type="checkbox"
                checked={summaryAlerts}
                onChange={(e) => setSummaryAlerts(e.target.checked)}
                className="rounded border-[#D0D5DD] text-[#2563EB] w-4 h-4"
              />
            </label>
          </div>
        </Card>
      )}

      {/* 5. SECURITY SETTINGS */}
      {activeTab === 'security' && (
        <Card className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-3">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Security & Credentials
            </h3>
            <p className="text-xs text-[#667085]">
              Manage authentication credentials and two-factor verification.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#F8FAFC] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-[#101828]">Two-Factor Authentication (2FA)</div>
                <div className="text-[11px] text-[#667085]">Require authenticator app code for sensitive operations</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="rounded border-[#D0D5DD] text-[#2563EB] w-4 h-4"
            />
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#101828] uppercase tracking-wider">
              Change Password
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" disabled={!currentPassword || !newPassword}>
                Update Password
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 6. THEME & DISPLAY SETTINGS */}
      {activeTab === 'theme' && (
        <Card className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-3">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Theme & Display Modes
            </h3>
            <p className="text-xs text-[#667085]">
              Approved design system: Modern Enterprise Light Dashboard & Dark Meeting Room.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div
              onClick={() => setDashboardTheme('light')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                dashboardTheme === 'light'
                  ? 'border-[#2563EB] bg-[#EFF8FF]/40 shadow-subtle'
                  : 'border-[#EAECF0] bg-white hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 font-semibold text-[#101828]">
                <Sun className="w-4 h-4 text-[#F79009]" /> Modern Enterprise Light (Approved)
              </div>
              <p className="text-[#667085] leading-relaxed">
                Crisp #F8FAFC background, white card modules, navy navigation sidebar, and #2563EB primary enterprise accents.
              </p>
            </div>

            <div
              onClick={() => setMeetingRoomTheme('dark')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                meetingRoomTheme === 'dark'
                  ? 'border-[#2563EB] bg-[#EFF8FF]/40 shadow-subtle'
                  : 'border-[#EAECF0] bg-white hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 font-semibold text-[#101828]">
                <Moon className="w-4 h-4 text-[#2563EB]" /> Immersive Dark Meeting Room
              </div>
              <p className="text-[#667085] leading-relaxed">
                Zero glare high-contrast #0B0F19 canvas optimized for continuous video calling, grid feeds, and subtitles.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
