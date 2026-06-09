'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import UploadZone from '@/components/upload/UploadZone'
import LibraryActions from '@/components/ui/LibraryActions'
import { getAllDiagrams, deleteDiagram, getApiKey } from '@/lib/storage'
import { aiToFlowNodes, aiToFlowEdges, normalizePositions, applyDagreLayout, formatRelativeTime, cn } from '@/lib/utils'
import { extractDiagramFromImage } from '@/lib/aiExtraction'
import {
  BookOpen, FlaskConical, Trash2, Clock, Trophy, Plus,
  AlertCircle, Heart, Layers, Edit2,
  AlertTriangle,
} from 'lucide-react'
import type { DiagramRecord } from '@/lib/types'

// ─── Diagram card ─────────────────────────────────────────────────────────────
function DiagramCard({ diagram, onStudy, onExam, onEdit, onDelete }: {
  diagram: DiagramRecord; onStudy(): void; onExam(): void; onEdit(): void; onDelete(): void
}) {
  const hiddenCount = diagram.hiddenNodeIds.length ||
    diagram.nodes.filter(n => n.data.hideCategory !== 'none').length

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-[hsl(222_47%_10%)] hover:border-slate-700 transition-all">
      {/* Thumbnail */}
      <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
        {diagram.originalImageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={diagram.originalImageDataUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Heart className="w-5 h-5 text-slate-700" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm truncate">{diagram.title}</h3>
        <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
          {diagram.guidelineYear && (
            <span className="text-[10px] text-slate-500 font-mono bg-slate-800/60 px-1.5 py-0.5 rounded">
              {diagram.guidelineYear}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">
            {diagram.nodes.length} nodes · {hiddenCount} hidden
          </span>
          {diagram.studyCount > 0 && (
            <span className="text-[10px] text-slate-600 font-mono">
              {diagram.studyCount} session{diagram.studyCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          {diagram.lastStudiedAt && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-2.5 h-2.5" /> {formatRelativeTime(diagram.lastStudiedAt)}
            </span>
          )}
          {diagram.bestScore != null && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <Trophy className="w-2.5 h-2.5" /> {diagram.bestScore.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} title="Edit"
          className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onStudy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-sky-950/60 border border-sky-800/50 text-sky-300 hover:bg-sky-950/80 transition-all font-medium">
          <BookOpen className="w-3 h-3" /> Study
        </button>
        <button onClick={onExam}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-rose-950/50 border border-rose-800/50 text-rose-300 hover:bg-rose-950/70 transition-all font-medium">
          <FlaskConical className="w-3 h-3" /> Exam
        </button>
        <button onClick={onDelete} title="Delete"
          className="p-1.5 rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const [diagrams, setDiagrams] = useState<DiagramRecord[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => { setHasApiKey(!!getApiKey()) }, [])

  const reload = useCallback(() => setDiagrams(getAllDiagrams()), [])
  useEffect(() => reload(), [reload])

  const handleImageReady = async (base64: string, mediaType: string, fileName?: string) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setError('Add your Anthropic API key in Settings first.')
      return
    }
    setExtracting(true)
    setError(null)
    try {
      setExtractProgress('Sending image to Claude…')
      const extracted = await extractDiagramFromImage(base64, mediaType, apiKey)
      setExtractProgress('Building interactive diagram…')
      let nodes = aiToFlowNodes(extracted.nodes)
      const edges = aiToFlowEdges(extracted.edges)
      nodes = applyDagreLayout(normalizePositions(nodes), edges)

      const id = uuid()
      const record: DiagramRecord = {
        id,
        title: extracted.title || fileName?.replace(/\.(jpg|jpeg|png|pdf|webp)$/i, '') || 'Untitled Diagram',
        guidelineYear: extracted.guidelineYear,
        guidelineSection: extracted.guidelineSection,
        originalImageDataUrl: base64,
        nodes,
        edges,
        hiddenNodeIds: extracted.hiddenFieldSuggestions ?? [],
        acceptedAnswers: extracted.acceptedAnswers ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        studyCount: 0,
      }

      sessionStorage.setItem(`pending_diagram_${id}`, JSON.stringify({
        record,
        extractionNotes: extracted.extractionNotes,
        confidence: extracted.confidence,
      }))

      router.push(`/editor/${id}?new=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed. Please try again.')
    } finally {
      setExtracting(false)
      setExtractProgress('')
    }
  }

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    deleteDiagram(id)
    reload()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-medical-blue" />
            ESC Algorithm Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Interactive study tool for ESC cardiology guidelines
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <LibraryActions onImportDone={reload} />
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
              showUpload
                ? 'bg-medical-blue/20 border-medical-blue/40 text-medical-blue'
                : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            )}
          >
            <Plus className="w-4 h-4" />
            {showUpload ? 'Cancel' : 'New Diagram'}
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="rounded-2xl border border-slate-700 bg-[hsl(222_47%_10%)] p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-medical-blue" />
            Import ESC Guideline Diagram
          </h2>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            Upload a screenshot or PDF page of any ESC algorithm or flowchart.
            Claude will extract nodes, edges, and text — then you verify before saving.
          </p>

          {extracting ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-medical-blue/20 border-t-medical-blue animate-spin" />
                <Heart className="w-6 h-6 text-medical-blue absolute inset-0 m-auto animate-pulse-slow" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">{extractProgress}</p>
                <p className="text-slate-500 text-sm mt-1">This takes 15–30 seconds</p>
              </div>
            </div>
          ) : (
            <UploadZone onImageReady={handleImageReady} loading={extracting} />
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>
      )}

      {/* API key prompt */}
      {!hasApiKey && !showUpload && diagrams.length === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-800/40 bg-amber-950/30 text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            You need an Anthropic API key to extract diagrams.{' '}
            Click <strong>Settings</strong> in the top navigation to add yours.
          </p>
        </div>
      )}

      {/* Library */}
      {diagrams.length === 0 && !showUpload ? (
        <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
          <Heart className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No diagrams yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Upload a screenshot or PDF of any ESC guideline flowchart to get started
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-5 py-2.5 rounded-xl bg-medical-blue/20 border border-medical-blue/40 text-medical-blue text-sm font-semibold hover:bg-medical-blue/30 transition-all"
          >
            Upload First Diagram
          </button>
        </div>
      ) : diagrams.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {diagrams.length} Diagram{diagrams.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="grid gap-2.5">
            {diagrams.map(d => (
              <DiagramCard
                key={d.id}
                diagram={d}
                onStudy={() => router.push(`/study/${d.id}`)}
                onExam={() => router.push(`/exam/${d.id}`)}
                onEdit={() => router.push(`/editor/${d.id}`)}
                onDelete={() => handleDelete(d.id, d.title)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
