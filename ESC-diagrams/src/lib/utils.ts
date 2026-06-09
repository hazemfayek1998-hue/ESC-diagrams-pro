import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dagre from 'dagre'
import type { ESCEdge, ESCNodeData, AIExtractedNode, AIExtractedEdge, NodeType } from './types'
import type { ESCFlowNode } from '@/components/flow/CustomNodes'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Dagre Auto-Layout ───────────────────────────────────────────────────────
export function applyDagreLayout(
  nodes: ESCFlowNode[],
  edges: ESCEdge[],
  direction: 'TB' | 'LR' = 'TB'
): ESCFlowNode[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 })

  nodes.forEach(n => {
    const w = n.data.nodeType === 'decision' ? 180 : 220
    const h = n.data.nodeType === 'decision' ? 100 : 70
    g.setNode(n.id, { width: w, height: h })
  })
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return nodes.map(n => {
    const pos = g.node(n.id)
    if (!pos) return n
    const w = pos.width ?? 220
    const h = pos.height ?? 70
    return { ...n, position: { x: pos.x - w / 2, y: pos.y - h / 2 } }
  })
}

// ─── Convert AI extraction → React Flow nodes/edges ────────────────────────
export function aiToFlowNodes(
  aiNodes: AIExtractedNode[],
): ESCFlowNode[] {
  return aiNodes.map(n => ({
    id: n.id,
    type: 'escNode' as const,
    position: n.position,
    data: {
      label: n.label,
      originalLabel: n.label,
      nodeType: n.type as NodeType,
      isHidden: false,
      hideCategory: 'none',
    } satisfies ESCNodeData,
  }))
}

export function aiToFlowEdges(aiEdges: AIExtractedEdge[]): ESCEdge[] {
  return aiEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'smoothstep',
    animated: false,
  }))
}

// ─── Normalize positions ─────────────────────────────────────────────────────
export function normalizePositions(nodes: ESCFlowNode[]): ESCFlowNode[] {
  if (nodes.length === 0) return nodes
  const xs = nodes.map(n => n.position.x)
  const ys = nodes.map(n => n.position.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  return nodes.map(n => ({
    ...n,
    position: {
      x: ((n.position.x - minX) / rangeX) * 700 + 50,
      y: ((n.position.y - minY) / rangeY) * 1100 + 50,
    },
  }))
}

// ─── Answer checking ─────────────────────────────────────────────────────────
export function normalizeAnswer(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function isAnswerCorrect(
  userAnswer: string,
  acceptedAnswers: string[]
): boolean {
  if (!userAnswer) return false
  const normalized = normalizeAnswer(userAnswer)
  return acceptedAnswers.some(a => normalizeAnswer(a) === normalized)
}

// ─── File helpers ────────────────────────────────────────────────────────────
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function stripDataUrlPrefix(dataUrl: string): string {
  return dataUrl.replace(/^data:[^;]+;base64,/, '')
}

// ─── Date formatting ─────────────────────────────────────────────────────────
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(iso))
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}
