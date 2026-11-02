import { AiService as EnhancedAiService } from './ai/ai.service'
import {
  DialogueSegment,
  StructuredSummary,
  ExtractedActionItem,
  AssistantAnswer,
  MeetingInsights,
  JobStatus,
} from './ai/ai.types'

export interface DialogueInput {
  speaker: string
  text: string
  timestamp?: string
}

export interface SummarizeResult {
  summary: string
  executiveSummary: string
  keyDecisions: string[]
  actionItems: Array<{
    id: number | string
    text: string
    assignee: string
    completed: boolean
    priority?: 'low' | 'medium' | 'high'
  }>
  topicsDiscussed: string[]
  sentiment: 'positive' | 'neutral' | 'constructive' | 'mixed'
  generatedBy: 'openai' | 'rule_based_nlp' | 'contextual_nlp'
  generatedAt: string
}

export class AiService extends EnhancedAiService {
  /**
   * Backward-compatible method for existing Phase 1/2 tests
   */
  public static async summarizeConversation(
    roomName: string,
    transcript: DialogueInput[],
    messages: DialogueInput[]
  ): Promise<SummarizeResult> {
    const res = await EnhancedAiService.summarizeMeeting(roomName, transcript, messages)

    return {
      summary: res.summary.meetingOverview,
      executiveSummary: res.summary.meetingOverview,
      keyDecisions: res.summary.importantDecisions,
      actionItems: res.actionItems.map((a, i) => ({
        id: a.id || i + 1,
        text: a.title,
        assignee: a.assignee,
        completed: a.status === 'completed',
        priority: a.priority,
      })),
      topicsDiscussed: res.summary.topicsDiscussed,
      sentiment: res.summary.sentiment,
      generatedBy: res.summary.generatedBy as any,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  }
}

export * from './ai/ai.types'
export { AiJobQueue } from './ai/aiJobQueue'
