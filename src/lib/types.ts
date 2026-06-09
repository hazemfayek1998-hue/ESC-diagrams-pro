// ─── Node Data ───────────────────────────────────────────────────────────────

export type NodeType = 'start' | 'end' | 'decision' | 'action' | 'condition' | 'info'
export type HideCategory = 'none' | 'medication' | 'threshold' | 'branch' | 'full'

export interface ESCNodeData extends Record<string, unknown> {
  label: string
  originalLabel: string
  nodeType: NodeType
  color?: string
  fontSize?: number
  isHidden: boolean
  hideCategory: HideCategory
  userAnswer?: string
  isCorrect?: boolean
  wasAnswered?: boolean
}

// ─── Edge ────────────────────────────────────────────────────────────────────

// Simple serializable edge for storage and component use
// Compatible with React Flow's Edge base properties
export interface ESCEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null | undefined
  targetHandle?: string | null | undefined
  label?: string
  animated?: boolean
  type?: string
}

// ─── Saved Diagram Record ────────────────────────────────────────────────────
// NOTE: nodes are stored as plain objects matching ESCFlowNode shape
export interface DiagramRecord {
  id: string
  title: string
  guidelineYear?: string
  guidelineSection?: string
  originalImageDataUrl?: string
  sourceUrl?: string
  // Stored as serialized ESCFlowNode objects
  nodes: StoredNode[]
  edges: ESCEdge[]
  hiddenNodeIds: string[]
  acceptedAnswers: Record<string, string[]>
  createdAt: string
  updatedAt: string
  lastStudiedAt?: string
  studyCount: number
  bestScore?: number
}

// Plain serializable node (no React-specific generics)
export interface StoredNode {
  id: string
  type: string
  data: ESCNodeData
  position: { x: number; y: number }
  width?: number
  height?: number
}

// ─── AI Extraction ───────────────────────────────────────────────────────────

export interface AIExtractedNode {
  id: string
  type: NodeType
  label: string
  position: { x: number; y: number }
  notes?: string
}

export interface AIExtractedEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface AIExtractionResult {
  title: string
  guidelineYear?: string
  guidelineSection?: string
  nodes: AIExtractedNode[]
  edges: AIExtractedEdge[]
  hiddenFieldSuggestions: string[]
  acceptedAnswers: Record<string, string[]>
  extractionNotes: string
  confidence: 'high' | 'medium' | 'low'
}

// ─── Exam ────────────────────────────────────────────────────────────────────

export interface ExamResults {
  score: number
  totalQuestions: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  nodeResults: NodeResult[]
  completedAt: string
  timeTakenSeconds?: number
}

export interface NodeResult {
  nodeId: string
  label: string
  userAnswer: string
  isCorrect: boolean
  acceptedAnswers: string[]
}

// ─── App Settings ────────────────────────────────────────────────────────────

export type AIProvider = 'anthropic' | 'openai' | 'gemini' | 'groq'

export interface AppSettings {
  apiKey: string
  aiProvider: AIProvider
  defaultHideCategories: HideCategory[]
  showMinimap: boolean
  darkMode: boolean
  autoLayout: boolean
}

export const PROVIDER_META: Record<AIProvider, {
  name: string
  model: string
  docs: string
  keyPlaceholder: string
  freeTier: string
  color: string
}> = {
  gemini: {
    name: 'Google Gemini',
    model: 'gemini-1.5-flash',
    docs: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIza...',
    freeTier: '15 req/min · 1500/day',
    color: 'text-yellow-400',
  },
  anthropic: {
    name: 'Anthropic Claude',
    model: 'claude-sonnet-4-20250514',
    docs: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-api03-...',
    freeTier: 'Paid (Haiku ~$0.80/mo)',
    color: 'text-orange-400',
  },
  openai: {
    name: 'OpenAI',
    model: 'gpt-4o-mini',
    docs: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...',
    freeTier: '$5 free credit',
    color: 'text-green-400',
  },
  groq: {
    name: 'Groq + Llama',
    model: 'llama-3.2-90b-vision-preview',
    docs: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
    freeTier: 'Fast · 30 req/min',
    color: 'text-pink-400',
  },
}
