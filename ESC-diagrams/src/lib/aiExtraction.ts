import type { AIExtractionResult } from './types'

const EXTRACTION_SYSTEM_PROMPT = `You are a specialized medical diagram analysis AI. Your ONLY task is to extract the exact structure of ESC (European Society of Cardiology) guideline flowcharts and algorithms from images.

CRITICAL ACCURACY RULES:
1. Copy ALL text EXACTLY as written — including abbreviations, numbers, units, drug names, dosages.
2. If text is unclear or partially visible, write [unclear: your best guess].
3. NEVER invent, add, or modify any medical content. Only extract what is visibly present.
4. NEVER hallucinate clinical information — medical accuracy is life-critical.
5. Prefer "I don't know" over guessing.

OUTPUT FORMAT: Return ONLY valid JSON with no markdown fences, no preamble, no explanation.`

const EXTRACTION_USER_PROMPT = `Analyze this ESC cardiology guideline diagram/flowchart image.

Extract every visible element with maximum accuracy.

Return ONLY this exact JSON structure (no markdown, no extra text):

{
  "title": "exact diagram title if visible, else infer from content",
  "guidelineYear": "year if visible",
  "guidelineSection": "section/chapter if visible",
  "nodes": [
    {
      "id": "n1",
      "type": "start|end|decision|action|condition|info",
      "label": "EXACT text from node — word for word, including all abbreviations and numbers",
      "position": { "x": 0, "y": 0 },
      "notes": "optional: any extraction uncertainty for this node"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "label": "edge label if any (Yes/No/Grade/etc)"
    }
  ],
  "hiddenFieldSuggestions": ["n3", "n5"],
  "acceptedAnswers": {
    "n3": ["Aspirin 75–100 mg/day", "Aspirin", "ASA 75mg"]
  },
  "extractionNotes": "any overall extraction notes, uncertainties, or warnings",
  "confidence": "high|medium|low"
}

NODE POSITIONING RULES:
- Use approximate pixel coordinates relative to image top-left (0,0)
- Typical image is ~800×1200 px — scale accordingly
- Preserve spatial layout as closely as possible
- Top nodes have low y, bottom nodes have high y

NODE TYPE GUIDE:
- "start" → oval/rounded rectangle at top (patient presentation, indication)
- "end" → oval/rounded rectangle at bottom (outcome, final recommendation)  
- "decision" → diamond shape (Yes/No branch, risk assessment)
- "action" → rectangle (treatment, procedure, drug prescription)
- "condition" → rounded rectangle (clinical condition, finding)
- "info" → note/annotation box

HIDDEN FIELD SUGGESTIONS:
- Suggest hiding nodes that contain: specific drug names/doses, numerical thresholds, risk scores, specific recommendations
- Do NOT suggest hiding structural/decision nodes
- For each suggested hidden node, provide 2-3 accepted answer variants in acceptedAnswers`

export async function extractDiagramFromImage(
  imageBase64: string,
  mediaType: string,
  apiKey: string
): Promise<AIExtractionResult> {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType, apiKey }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `Extraction failed: ${response.status}`)
  }

  const result = await response.json()
  return result as AIExtractionResult
}

export async function extractDiagramFromUrl(
  url: string,
  apiKey: string
): Promise<{ imageDataUrl: string; extraction: AIExtractionResult }> {
  const response = await fetch('/api/extract-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, apiKey }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `URL extraction failed: ${response.status}`)
  }

  return response.json()
}

export { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT }
