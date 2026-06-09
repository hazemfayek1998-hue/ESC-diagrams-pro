export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT } from '@/lib/aiExtraction'
import type { AIExtractionResult } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, apiKey } = await req.json()

    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) {
      return NextResponse.json(
        { error: 'No API key provided. Add your Anthropic API key in Settings.' },
        { status: 401 }
      )
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64

    const client = new Anthropic({ apiKey: key })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: (mediaType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            { type: 'text', text: EXTRACTION_USER_PROMPT },
          ],
        },
      ],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    // Clean up JSON (remove possible markdown fences)
    let jsonStr = textContent.text.trim()
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')

    let extracted: AIExtractionResult
    try {
      extracted = JSON.parse(jsonStr)
    } catch {
      // Try to extract JSON from the response
      const match = jsonStr.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('AI did not return valid JSON. Please try again.')
      extracted = JSON.parse(match[0])
    }

    // Validate minimum structure
    if (!extracted.nodes || !Array.isArray(extracted.nodes)) {
      throw new Error('AI extraction returned invalid structure — no nodes found')
    }
    if (!extracted.edges || !Array.isArray(extracted.edges)) {
      extracted.edges = []
    }
    if (!extracted.hiddenFieldSuggestions) extracted.hiddenFieldSuggestions = []
    if (!extracted.acceptedAnswers) extracted.acceptedAnswers = {}

    return NextResponse.json(extracted)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed'
    console.error('Extraction error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
