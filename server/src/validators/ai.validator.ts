import { z } from 'zod'

export const summarizeMeetingSchema = z.object({
  body: z.object({
    roomName: z.string().optional().default('IntellMeet Session'),
    transcript: z
      .array(
        z.object({
          speaker: z.string(),
          text: z.string(),
          timestamp: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    messages: z
      .array(
        z.object({
          sender: z.string(),
          text: z.string(),
          isSystem: z.boolean().optional().default(false),
          timestamp: z.string().optional(),
        })
      )
      .optional()
      .default([]),
  }),
})
