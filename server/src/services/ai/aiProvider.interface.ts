import {
  DialogueSegment,
  StructuredSummary,
  ExtractedActionItem,
  AssistantAnswer,
} from './ai.types'

export interface IAiProvider {
  name: string

  /**
   * Generates a structured multi-section meeting summary
   */
  generateSummary(
    roomName: string,
    transcript: DialogueSegment[]
  ): Promise<StructuredSummary>

  /**
   * Extracts actionable tasks with assignee detection without hallucinations
   */
  extractActionItems(
    roomName: string,
    transcript: DialogueSegment[]
  ): Promise<ExtractedActionItem[]>

  /**
   * Answers contextual questions regarding meeting decisions and topics
   */
  answerQuestion(
    question: string,
    transcript: DialogueSegment[],
    summary?: StructuredSummary | null
  ): Promise<AssistantAnswer>

  /**
   * Transcribes raw audio buffer into timestamped speech segments
   */
  transcribeAudio?(
    audioBuffer: Buffer,
    fileName: string,
    mimeType: string,
    language?: string
  ): Promise<DialogueSegment[]>
}
