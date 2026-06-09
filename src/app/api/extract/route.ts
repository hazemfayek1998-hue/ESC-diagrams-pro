export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT } from '@/lib/aiExtraction'
import type { AIExtractionResult, AIProvider } from '@/lib/types'

// ─── Provider configs ─────────────────────────────────────────────────────────

const PROVIDERS = {
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    buildBody: (base64: string, media: string, system: string, user: string) => ({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: { mimeType: media, data: base64 },
          },
          { text: system + '\n\n' + user },
        ],
      }],
      generationConfig: { maxOutputTokens: 4096 },
    }),
    extractText: (data: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }) =>
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    buildBody: (_base64: string, media: string, system: string, user: string) => ({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: media, data: _base64 } },
          { type: 'text', text: user },
        ],
      }],
    }),
    headers: (key: string) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }),
    extractText: (data: { content?: Array<{ type: string; text?: string }> }) =>
      data.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '',
  },
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    buildBody: (base64: string, media: string, _system: string, user: string) => ({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${media};base64,${base64}` },
            },
            { type: 'text', text: user },
          ],
        },
      ],
    }),
    headers: (key: string) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    }),
    extractText: (data: { choices?: Array<{ message?: { content?: string } }> }) =>
      data.choices?.[0]?.message?.content ?? '',
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    buildBody: (base64: string, media: string, _system: string, user: string) => ({
      model: 'llama-3.2-90b-vision-preview',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${media};base64,${base64}` },
            },
            { type: 'text', text: user },
          ],
        },
      ],
    }),
    headers: (key: string) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    }),
    extractText: (data: { choices?: Array<{ message?: { content?: string } }> }) =>
      data.choices?.[0]?.message?.content ?? '',
  },
} as const

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, apiKey, provider } = await req.json()

    const selectedProvider = (provider ?? 'gemini') as AIProvider
    const key = apiKey || process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY

    if (!key) {
      return NextResponse.json(
        { error: 'No API key found. Add one in Settings.' },
        { status: 401 }
      )
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Strip data URL prefix
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64

    const media = mediaType ?? 'image/jpeg'
    const cfg = PROVIDERS[selectedProvider as keyof typeof PROVIDERS] ?? PROVIDERS.gemini

    // Build request
    const body = cfg.buildBody(base64Data, media, EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT)
    const headers: Record<string, string> = cfg.headers
      ? cfg.headers(key) as Record<string, string>
      : { 'x-api-key': key, 'content-type': 'application/json' }

    // Add ?key= for Gemini
    const url = selectedProvider === 'gemini'
      ? `${cfg.endpoint}?key=${key}`
      : cfg.endpoint

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`API error (${selectedProvider}):`, response.status, err)
      throw new Error(`API error: ${response.status} — ${err.slice(0, 200)}`)
    }

    const data = await response.json()
    const rawText = cfg.extractText(data)

    if (!rawText) throw new Error('No text response from AI')

    // Parse JSON
    let jsonStr = rawText.trim()
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')

    let extracted: AIExtractionResult
    try {
      extracted = JSON.parse(jsonStr)
    } catch {
      const match = jsonStr.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('AI did not return valid JSON. Please try again.')
      extracted = JSON.parse(match[0])
    }

    // Validate structure
    if (!extracted.nodes || !Array.isArray(extracted.nodes)) {
      throw new Error('AI returned invalid structure — no nodes found')
    }
    if (!extracted.edges || !Array.isArray(extracted.edges)) extracted.edges = []
    if (!extracted.hiddenFieldSuggestions) extracted.hiddenFieldSuggestions = []
    if (!extracted.acceptedAnswers) extracted.acceptedAnswers = {}

    return NextResponse.json(extracted)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed'
    console.error('Extraction error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}