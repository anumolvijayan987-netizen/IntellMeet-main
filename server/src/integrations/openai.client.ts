import { env } from '../config/env'
import { logger } from '../utils/logger'

export class OpenAiClient {
  private static apiKey = env.OPENAI_API_KEY

  public static isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5)
  }

  public static async generateCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model = 'gpt-4o-mini'
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key is not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      logger.error('OpenAI API error:', { status: response.status, body: errText })
      throw new Error(`OpenAI error HTTP ${response.status}`)
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>
    }
    return data.choices[0]?.message?.content || ''
  }
}
