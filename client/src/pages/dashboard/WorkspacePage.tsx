import React, { useState, useEffect } from 'react'
import {
  Layers,
  Users,
  UserPlus,
  Shield,
  Search,
  MoreVertical,
  Mail,
  CheckCircle2,
  Trash2,
  Settings,
  Activity,
  HardDrive,
  Video,
  ListTodo,
  Lock,
  Globe,
  Loader2,
  Building2,
  Save,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Tabs } from '../../components/ui/Tabs'
import { useAuthStore } from '../../stores/authStore'
import {
  workspaceService,
  WorkspaceMemberDto,
  WorkspaceDashboardStats,
  WorkspaceActivityItem,
} from '../../services/workspaceService'
import { useToast } from '../../contexts/ToastContext'

export const WorkspacePage: React.FC = () => {
  const { workspaceName, setWorkspaceName } = useAuthStore()
  const { success, info, error } = useToast()

  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'settings'>('members')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [stats, setStats] = useState<WorkspaceDashboardStats | null>(null)
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([])
  const [activities, setActivities] = useState<WorkspaceActivityItem[]>([])

  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'member' | 'guest'>('member')
  const [isInviting, setIsInviting] = useState(false)

  // Role Change Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<WorkspaceMemberDto | null>(null)
  const [targetRole, setTargetRole] = useState<'owner' | 'admin' | 'member' | 'guest'>('member')

  // Settings states
  const [wsName, setWsName] = useState(workspaceName || 'Core Engineering')
  const [wsSlug, setWsSlug] = useState('core-eng')
  const [wsDescription, setWsDescription] = useState('Central infrastructure, WebRTC streaming, and collaboration engineering.')
  const [wsIsPrivate, setWsIsPrivate] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsData, membersData, activityData] = await Promise.all([
        workspaceService.getDashboard().catch(() => null),
        workspaceService.getMembers().catch(() => []),
        workspaceService.getActivity().catch(() => []),
      ])

      if (statsData) setStats(statsData)
      if (membersData) setMembers(membersData)
      if (activityData) setActivities(activityData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || isInviting) return

    setIsInviting(true)
    try {
      await workspaceService.inviteMember('ws_general', inviteEmail.trim(), inviteRole)
      success(`Invitation sent to ${inviteEmail.trim()}`)
      setInviteEmail('')
      setInviteModalOpen(false)
      await fetchData()
    } catch (err) {
      console.error('Failed to invite member:', err)
      error('Failed to send workspace invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleOpenRoleModal = (member: WorkspaceMemberDto) => {
    setSelectedMember(member)
    setTargetRole(member.role)
    setRoleModalOpen(true)
  }

  const handleSaveRole = async () => {
    if (!selectedMember) return
    const memberId = selectedMember._id || selectedMember.id || ''

    try {
      await workspaceService.updateMemberRole('ws_general', memberId, targetRole)
      success(`Role updated to ${targetRole}`)
      setRoleModalOpen(false)
      await fetchData()
    } catch (err) {
      console.error('Failed to update role:', err)
      error('Failed to update member role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return
    try {
      await workspaceService.removeMember('ws_general', memberId)
      info('Member removed from workspace')
      await fetchData()
    } catch (err) {
      console.error('Failed to remove member:', err)
      error('Failed to remove member')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    try {
      await workspaceService.updateSettings('ws_general', {
        name: wsName,
        slug: wsSlug,
        description: wsDescription,
        isPrivate: wsIsPrivate,
      })
      setWorkspaceName(wsName)
      setSettingsSaved(true)
      success('Workspace settings updated successfully')
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      error('Failed to update workspace settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const filteredMembers = members.filter((m) => {
    const name = m.userId?.name || ''
    const email = m.userId?.email || ''
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-[#101828]">
              {wsName}
            </h1>
            <Badge variant="primary" size="sm">
              <Building2 className="w-3.5 h-3.5 text-[#2563EB]" /> Enterprise Workspace
            </Badge>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Manage team members, roles, permissions, audit activity, and collaboration settings.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<UserPlus className="w-4 h-4" />}
          onClick={() => setInviteModalOpen(true)}
        >
          Invite Member
        </Button>
      </div>

      {/* Workspace Dashboard Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#667085]">Team Members</div>
            <div className="text-base font-bold text-[#101828]">
              {members.length || stats?.memberCount || 4}
            </div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ECFDF3] text-[#12B76A] flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#667085]">Active Calls</div>
            <div className="text-base font-bold text-[#12B76A]">
              {stats?.activeMeetingsCount ?? 1} Live
            </div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFF6ED] text-[#F79009] flex items-center justify-center shrink-0">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#667085]">Pending Tasks</div>
            <div className="text-base font-bold text-[#F79009]">
              {stats?.pendingTasksCount ?? 4}
            </div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] text-[#344054] flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#667085]">Cloud Storage</div>
            <div className="text-base font-bold text-[#101828]">
              {stats?.storageUsedGb ?? 1.4} / {stats?.storageLimitGb ?? 25} GB
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        tabs={[
          { id: 'members', label: 'Team Members', icon: <Users className="w-4 h-4" /> },
          { id: 'activity', label: 'Team Activity', icon: <Activity className="w-4 h-4" /> },
          { id: 'settings', label: 'Workspace Settings', icon: <Settings className="w-4 h-4" /> },
        ]}
      />

      {/* TAB 1: MEMBERS LIST & ROLE MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-xs text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="text-xs text-[#667085] font-medium">
              {filteredMembers.length} members enrolled
            </div>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EAECF0] text-[#667085] uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0]">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-[#667085]">
                        No team members found.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const u = member.userId || {}
                      const isOwner = member.role === 'owner'
                      return (
                        <tr key={member._id || member.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={
                                u.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'
                              }
                              alt={u.name || 'Member'}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#EAECF0]"
                            />
                            <div>
                              <div className="font-semibold text-[#101828]">{u.name || 'Team Colleague'}</div>
                              <div className="text-[11px] text-[#667085]">{u.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                member.role === 'owner'
                                  ? 'navy'
                                  : member.role === 'admin'
                                  ? 'primary'
                                  : 'gray'
                              }
                              size="sm"
                            >
                              {member.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-medium text-[#12B76A]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isOwner && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenRoleModal(member)}
                                  >
                                    Change Role
                                  </Button>
                                  <button
                                    onClick={() => handleRemoveMember(member._id || member.id || '')}
                                    className="p-1.5 rounded-lg text-[#F04438] hover:bg-[#FEE4E2] transition-colors"
                                    title="Remove member"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: TEAM ACTIVITY FEED */}
      {activeTab === 'activity' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
            <div>
              <h3 className="font-heading font-semibold text-sm text-[#101828]">
                Recent Workspace Activity
              </h3>
              <p className="text-xs text-[#667085]">
                Audit log of completed meetings, member invitations, and action items.
              </p>
            </div>
            <Badge variant="primary" size="sm">
              Live Stream
            </Badge>
          </div>

          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#F8FAFC] flex items-start gap-3.5 text-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#101828]">{act.title}</span>
                    <span className="text-[10px] text-[#98A2B3]">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#475467]">{act.details}</p>
                  <div className="text-[10px] text-[#2563EB] font-medium">Actor: {act.actorName}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: WORKSPACE SETTINGS */}
      {activeTab === 'settings' && (
        <Card className="space-y-6">
          <div className="border-b border-[#EAECF0] pb-4">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Workspace Configuration
            </h3>
            <p className="text-xs text-[#667085]">
              Update workspace identification, custom URL slug, and access privacy.
            </p>
          </div>

          {settingsSaved && (
            <div className="p-3 bg-[#ECFDF3] border border-[#A6F4C5] rounded-xl text-xs text-[#027A48] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Workspace settings saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
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
              <label className="block text-xs font-medium text-[#344054]">
                Description
              </label>
              <textarea
                value={wsDescription}
                onChange={(e) => setWsDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#D0D5DD] flex items-center justify-center text-[#2563EB]">
                  {wsIsPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#101828]">Private Workspace</div>
                  <div className="text-[11px] text-[#667085]">
                    Require explicit invitations to view meetings and chat history
                  </div>
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
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSavingSettings}
                icon={
                  isSavingSettings ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )
                }
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Colleague"
        description="Send an invitation to join this workspace."
      >
        <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            autoFocus
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-[#344054]">Workspace Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
            >
              <option value="member">Member (Can host & join meetings)</option>
              <option value="admin">Admin (Can manage workspace settings)</option>
              <option value="guest">Guest (Can join assigned rooms only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isInviting}>
              {isInviting ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      {selectedMember && (
        <Modal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          title="Change Member Role"
          description={`Update permissions for ${selectedMember.userId?.name || 'User'}`}
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-[#344054]">Select Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRoleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleSaveRole}>
                Update Role
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
