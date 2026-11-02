import { z } from 'zod'

export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(150).optional().default('IntellMeet Session'),
    roomId: z.string().min(3).max(64),
    passCode: z.string().optional(),
    hostName: z.string().min(1).default('Anonymous Host'),
    type: z.enum(['instant', 'scheduled', 'recurring']).default('instant'),
    scheduledStartTime: z.string().datetime().optional(),
    settings: z
      .object({
        isMutedOnEntry: z.boolean().default(false),
        isCamOffOnEntry: z.boolean().default(false),
        allowScreenSharing: z.boolean().default(true),
        enableTranscription: z.boolean().default(true),
        enableAiSummaries: z.boolean().default(true),
      })
      .optional(),
  }),
})

export const saveMeetingReportSchema = z.object({
  body: z.object({
    roomId: z.string().min(3),
    title: z.string().optional(),
    hostName: z.string().optional().default('Host'),
    participants: z.array(z.string()).optional().default([]),
    summary: z.string().optional().default(''),
    keyDecisions: z.array(z.string()).optional().default([]),
    actionItems: z
      .array(
        z.object({
          id: z.union([z.string(), z.number()]).optional(),
          text: z.string(),
          assignee: z.string().default('Unassigned'),
          completed: z.boolean().default(false),
        })
      )
      .optional()
      .default([]),
  }),
})

export const getMeetingByRoomSchema = z.object({
  params: z.object({
    roomId: z.string().min(3),
  }),
})
