'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import DiagramEditor from '@/components/editor/DiagramEditor'
import { getDiagram, saveDiagram } from '@/lib/storage'
import { Loader2 } from 'lucide-react'
import type { DiagramRecord, StoredNode, ESCEdge } from '@/lib/types'

export default function EditorPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const isNew = searchParams.get('new') === '1'

  const [diagram, setDiagram] = useState<DiagramRecord | null>(null)
  const [extractionNotes, setExtractionNotes] = useState<string>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isNew) {
      const raw = sessionStorage.getItem(`pending_diagram_${id}`)
      if (raw) {
        const { record, extractionNotes: notes } = JSON.parse(raw)
        setDiagram(record)
        setExtractionNotes(notes)
      } else {
        setDiagram(getDiagram(id))
      }
    } else {
      setDiagram(getDiagram(id))
    }
    setLoading(false)
  }, [id, isNew])

  const handleSave = (
    nodes: StoredNode[],
    edges: ESCEdge[],
    title: string,
    acceptedAnswers: Record<string, string[]>
  ) => {
    if (!diagram) return
    const updated: DiagramRecord = {
      ...diagram,
      title,
      nodes,
      edges,
      acceptedAnswers,
      hiddenNodeIds: nodes.filter(n => n.data.hideCategory !== 'none').map(n => n.id),
      updatedAt: new Date().toISOString(),
    }
    saveDiagram(updated)
    sessionStorage.removeItem(`pending_diagram_${id}`)
    router.push('/')
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 text-medical-blue animate-spin" /></div>
  }

  if (!diagram) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white font-semibold">Diagram not found</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 rounded-lg bg-medical-blue/20 border border-medical-blue/40 text-medical-blue text-sm">Back to Library</button>
      </div>
    )
  }

  return (
    <DiagramEditor
      initialNodes={diagram.nodes}
      initialEdges={diagram.edges}
      originalImageDataUrl={diagram.originalImageDataUrl}
      title={diagram.title}
      acceptedAnswers={diagram.acceptedAnswers}
      extractionNotes={extractionNotes}
      onSave={handleSave}
      onBack={() => router.push('/')}
    />
  )
}
