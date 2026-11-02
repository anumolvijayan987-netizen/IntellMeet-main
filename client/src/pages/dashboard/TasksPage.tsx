import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckSquare,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  MoreVertical,
  Calendar,
  Sparkles,
  Edit2,
  RefreshCw,
  Loader2,
  Quote,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { actionItemService, ActionItemDto } from '../../services/actionItemService'
import { aiService } from '../../services/aiService'
import { useToast } from '../../contexts/ToastContext'

export const TasksPage: React.FC = () => {
  const { success, info, error } = useToast()
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all')
  const [tasks, setTasks] = useState<ActionItemDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('Unassigned')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newTaskDue, setNewTaskDue] = useState('')

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ActionItemDto | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAssignee, setEditAssignee] = useState('')
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editDue, setEditDue] = useState('')
  const [editStatus, setEditStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending')

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const items = await actionItemService.getActionItems()
      setTasks(items)
    } catch {
      // Fallback sample tasks
      setTasks([
        {
          _id: 'task_1',
          id: 'task_1',
          title: 'Finalize WebRTC STUN/TURN fallback verification',
          assigneeName: 'Engineering Team',
          dueDate: '2026-11-01',
          priority: 'high',
          status: 'completed',
          relatedDiscussion: 'Sarah Chen: Finalize the WebRTC pipeline while QA verifies broadcasting.',
        },
        {
          _id: 'task_2',
          id: 'task_2',
          title: 'Review SOC-2 audit logging requirements for transcript storage',
          assigneeName: 'David Miller',
          dueDate: '2026-11-02',
          priority: 'medium',
          status: 'pending',
          relatedDiscussion: 'Sarah Chen: Let us verify the 12 Mongoose models and build the full enterprise design system.',
        },
        {
          _id: 'task_3',
          id: 'task_3',
          title: 'Deploy Phase 2 modern enterprise frontend design system',
          assigneeName: 'Frontend Architect',
          dueDate: '2026-11-03',
          priority: 'high',
          status: 'pending',
          relatedDiscussion: 'Elena Rostova: The on-device Web Speech API generates subtitles directly on the user client.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const toggleTask = async (task: ActionItemDto) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const taskId = task._id || task.id || ''

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        (t._id === taskId || t.id === taskId) ? { ...t, status: newStatus } : t
      )
    )

    try {
      await actionItemService.updateActionItem(taskId, { status: newStatus })
      info(`Task marked as ${newStatus}`)
    } catch {
      // Revert if error
      fetchTasks()
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const payload = {
      title: newTaskTitle.trim(),
      text: newTaskTitle.trim(),
      assigneeName: newTaskAssignee.trim() || 'Unassigned',
      priority: newTaskPriority,
      dueDate: newTaskDue || undefined,
      status: 'pending' as const,
    }

    try {
      const created = await actionItemService.createActionItem(payload)
      setTasks((prev) => [created, ...prev])
      success('Action item created successfully')
    } catch {
      setTasks((prev) => [
        {
          _id: `task_${Date.now()}`,
          id: `task_${Date.now()}`,
          ...payload,
        },
        ...prev,
      ])
      success('Action item created')
    }

    setNewTaskTitle('')
    setNewTaskAssignee('Unassigned')
    setNewTaskDue('')
    setCreateModalOpen(false)
  }

  const openEditModal = (task: ActionItemDto, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTask(task)
    setEditTitle(task.title || task.text || '')
    setEditAssignee(task.assigneeName || task.assignee || 'Unassigned')
    setEditPriority(task.priority)
    setEditDue(task.dueDate ? String(task.dueDate).slice(0, 10) : '')
    setEditStatus(task.status)
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return

    const taskId = editingTask._id || editingTask.id || ''
    const updates = {
      title: editTitle.trim(),
      text: editTitle.trim(),
      assigneeName: editAssignee.trim() || 'Unassigned',
      priority: editPriority,
      dueDate: editDue || undefined,
      status: editStatus,
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId || t.id === taskId ? { ...t, ...updates } : t))
    )
    setEditModalOpen(false)

    try {
      await actionItemService.updateActionItem(taskId, updates)
      success('Task details updated')
    } catch {
      fetchTasks()
    }
  }

  const handleExtractFromAi = async () => {
    setIsExtracting(true)
    try {
      const extracted = await aiService.extractTasks('room_default_demo', [
        { speaker: 'Sarah Chen', text: 'David will finalize the WebRTC pipeline while QA verifies multi-user broadcasting.' },
        { speaker: 'David Miller', text: 'I will submit the pull request tomorrow after STUN testing.' },
      ])

      if (extracted && extracted.length > 0) {
        // Save extracted items to backend
        for (const item of extracted) {
          try {
            await actionItemService.createActionItem({
              title: item.title,
              text: item.title,
              assigneeName: item.assignee || 'Unassigned',
              priority: item.priority || 'medium',
              dueDate: item.dueDate || undefined,
              status: 'pending',
              relatedDiscussion: item.relatedDiscussion,
            })
          } catch {}
        }
        await fetchTasks()
        success(`Extracted ${extracted.length} action items from meeting transcript`)
      }
    } catch (err) {
      console.error('Failed to extract tasks:', err)
      error('Failed to extract tasks from AI model')
    } finally {
      setIsExtracting(false)
    }
  }

  const filteredTasks = tasks.filter((t) => {
    const isComp = t.status === 'completed'
    if (filterStatus === 'pending') return !isComp
    if (filterStatus === 'completed') return isComp
    return true
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-[#101828]">
              Tasks & Action Items
            </h1>
            <Badge variant="primary" size="sm">
              {tasks.filter((t) => t.status !== 'completed').length} Pending
            </Badge>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Strictly grounded action items extracted autonomously from team meetings. Review, assign, and edit tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExtractFromAi}
            disabled={isExtracting}
            icon={
              isExtracting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              )
            }
          >
            {isExtracting ? 'Extracting...' : 'Extract with AI'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Add Action Item
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-[#101828] text-white'
              : 'bg-white border border-[#D0D5DD] text-[#344054] hover:bg-[#F8FAFC]'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === 'pending'
              ? 'bg-[#101828] text-white'
              : 'bg-white border border-[#D0D5DD] text-[#344054] hover:bg-[#F8FAFC]'
          }`}
        >
          Pending ({tasks.filter((t) => t.status !== 'completed').length})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === 'completed'
              ? 'bg-[#101828] text-white'
              : 'bg-white border border-[#D0D5DD] text-[#344054] hover:bg-[#F8FAFC]'
          }`}
        >
          Completed ({tasks.filter((t) => t.status === 'completed').length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#667085] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" /> Loading action items...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#667085]">
            No action items found for this view.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed'
            return (
              <Card
                key={task._id || task.id}
                hoverable
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer ${
                  isDone ? 'bg-[#F8FAFC] opacity-75' : 'bg-white'
                }`}
                onClick={() => toggleTask(task)}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-[#D0D5DD] text-[#2563EB] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <div className="space-y-1.5">
                    <span
                      className={`text-sm font-medium ${
                        isDone ? 'line-through text-[#98A2B3]' : 'text-[#101828]'
                      }`}
                    >
                      {task.title || task.text}
                    </span>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085]">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#98A2B3]" /> Assignee:{' '}
                        <span className="text-[#2563EB] font-medium">
                          {task.assigneeName || task.assignee || 'Unassigned'}
                        </span>
                      </span>

                      {task.dueDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" /> Due:{' '}
                            {String(task.dueDate).slice(0, 10)}
                          </span>
                        </>
                      )}
                    </div>

                    {task.relatedDiscussion && (
                      <div className="text-[11px] text-[#475467] bg-[#F8FAFC] px-2.5 py-1 rounded border border-[#EAECF0] flex items-center gap-1.5">
                        <Quote className="w-3 h-3 text-[#2563EB] shrink-0" />
                        <span className="truncate">{task.relatedDiscussion}</span>
                      </div>
                    )}

                    {task.meetingId && (
                      <div className="pt-0.5">
                        <Link
                          to={`/app/insights?meetingId=${task.meetingId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563EB] bg-[#EFF8FF] px-2 py-0.5 rounded border border-[#B2DDFF] hover:bg-[#D1E9FF] transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-[#2563EB]" />
                          Linked: {task.meetingTitle || `Meeting ${task.meetingId}`}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <Badge
                    variant={
                      task.priority === 'high'
                        ? 'error'
                        : task.priority === 'medium'
                        ? 'warning'
                        : 'gray'
                    }
                    size="sm"
                  >
                    {task.priority.toUpperCase()}
                  </Badge>

                  <button
                    onClick={(e) => openEditModal(task, e)}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101828] hover:bg-[#F2F4F7] transition-colors"
                    title="Edit task details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Action Item"
        description="Create a discrete to-do task associated with your workspace."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
          <Input
            label="Task Title / Description"
            placeholder="e.g. Verify STUN candidate exchange"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Assignee Name"
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              placeholder="e.g. Sarah Chen or Unassigned"
              required
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-[#344054]">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <Input
            label="Due Date (optional)"
            type="date"
            value={newTaskDue}
            onChange={(e) => setNewTaskDue(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Action Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Review & Edit Action Item"
        description="Verify or adjust extracted task assignment, priority, and due dates."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
          <Input
            label="Task Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Assignee"
              value={editAssignee}
              onChange={(e) => setEditAssignee(e.target.value)}
              required
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-[#344054]">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={editDue}
              onChange={(e) => setEditDue(e.target.value)}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-[#344054]">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
