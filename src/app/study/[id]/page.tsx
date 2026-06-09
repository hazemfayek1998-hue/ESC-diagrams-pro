'use client'

export const runtime = 'edge'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import FlowCanvas from '@/components/flow/FlowCanvas'
import { type ESCFlowNode } from '@/components/flow/CustomNodes'
import ExamSetup, { type ExamConfig } from '@/components/exam/ExamSetup'
import { getDiagram } from '@/lib/storage'
import { isAnswerCorrect, cn } from '@/lib/utils'
import { Eye, EyeOff, RotateCcw, Loader2, ChevronLeft } from 'lucide-react'
import type { DiagramRecord, ESCEdge, HideCategory } from '@/lib/types'

const HIDE_LABELS: Record<HideCategory, string> = {
  none: '', medication: 'Med', threshold: 'Value', branch: 'Branch', full: 'Full',
}

// ─── Study canvas (after setup) ───────────────────────────────────────────────
function StudyCanvas({ diagram, config, onBack }: {
  diagram: DiagramRecord
  config: ExamConfig
  onBack: () => void
}) {
  const router = useRouter()
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [correctness, setCorrectness] = useState<Record<string, boolean | undefined>>({})
  const [instantFeedback, setInstantFeedback] = useState(config.mode === 'study')

  const hiddenIds = useMemo(() => new Set(config.hiddenNodeIds), [config.hiddenNodeIds])
  const hiddenNodes = useMemo(() => diagram.nodes.filter(n => hiddenIds.has(n.id)), [diagram.nodes, hiddenIds])

  const flowNodes = useMemo<ESCFlowNode[]>(() => diagram.nodes.map(n => ({
    ...n,
    type: 'escNode' as const,
    data: { ...n.data, isHidden: false, label: n.data.label, wasAnswered: false, isCorrect: undefined },
  })), [diagram.nodes])

  const [nodes] = useNodesState<ESCFlowNode>(flowNodes)
  const [edges] = useEdgesState<ESCEdge>(diagram.edges)

  const checkAnswer = useCallback((nodeId: string, answer: string) => {
    if (!answer.trim()) { setCorrectness(prev => ({ ...prev, [nodeId]: undefined })); return }
    const accepted = diagram.acceptedAnswers[nodeId] ?? [diagram.nodes.find(n => n.id === nodeId)?.data.originalLabel ?? '']
    setCorrectness(prev => ({ ...prev, [nodeId]: isAnswerCorrect(answer, accepted) }))
  }, [diagram])

  const reset = () => { setUserAnswers({}); setRevealed(new Set()); setCorrectness({}) }

  const score = hiddenNodes.length > 0
    ? (Object.values(correctness).filter(v => v === true).length / hiddenNodes.length) * 100
    : 0
  const answeredCount = Object.values(correctness).filter(v => v !== undefined).length

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(222_47%_7%)]">
      {/* Sidebar */}
      <div className="w-[290px] shrink-0 border-r border-slate-800 flex flex-col bg-[hsl(222_47%_9%)] overflow-hidden">
        <div className="p-4 border-b border-slate-800 shrink-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs mb-3 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Setup
          </button>
          <h2 className="text-white font-semibold text-sm line-clamp-2">{diagram.title}</h2>
          <span className="mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full border bg-sky-950/60 border-sky-800/60 text-sky-300 font-mono">📖 STUDY</span>
        </div>

        <div className="p-3 border-b border-slate-800 shrink-0 flex gap-2">
          <button
            onClick={() => setInstantFeedback(!instantFeedback)}
            className={cn('flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all border',
              instantFeedback ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white')}
          >
            {instantFeedback ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Instant {instantFeedback ? 'ON' : 'OFF'}
          </button>
          <button onClick={reset} className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {hiddenNodes.length === 0 ? (
            <p className="text-slate-500 text-xs text-center mt-8">No hidden fields selected.</p>
          ) : (
            hiddenNodes.map(node => {
              const answer = userAnswers[node.id] ?? ''
              const isCorr = correctness[node.id]
              const isRev = revealed.has(node.id)
              const accepted = diagram.acceptedAnswers[node.id] ?? [node.data.originalLabel]

              return (
                <div key={node.id} className="rounded-lg bg-slate-900/60 border border-slate-800 p-2.5 space-y-1.5">
                  {node.data.hideCategory !== 'none' && (
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                      {HIDE_LABELS[node.data.hideCategory]}
                    </span>
                  )}
                  <input
                    value={answer}
                    onChange={e => {
                      const v = e.target.value
                      setUserAnswers(prev => ({ ...prev, [node.id]: v }))
                      if (instantFeedback) checkAnswer(node.id, v)
                    }}
                    onBlur={() => checkAnswer(node.id, answer)}
                    placeholder="Type answer…"
                    className={cn(
                      'w-full bg-slate-800 border rounded-md px-2 py-1.5 text-xs text-white font-mono focus:outline-none transition-all',
                      !answer ? 'border-slate-700 focus:border-slate-500'
                        : isCorr === true ? 'border-emerald-600/60 bg-emerald-950/30'
                        : isCorr === false ? 'border-rose-600/50 bg-rose-950/20'
                        : 'border-slate-600'
                    )}
                  />
                  <div className="flex items-center justify-between gap-2 min-h-[16px]">
                    {instantFeedback && isCorr === false && answer && (
                      <p className="text-xs text-emerald-400 font-mono flex-1 truncate">✓ {accepted[0]}</p>
                    )}
                    {!isRev ? (
                      <button onClick={() => setRevealed(prev => new Set([...prev, node.id]))}
                        className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-0.5 ml-auto transition-colors">
                        <Eye className="w-3 h-3" /> reveal
                      </button>
                    ) : (
                      <p className="text-xs text-amber-300/70 font-mono ml-auto truncate">{accepted[0]}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {answeredCount > 0 && (
          <div className="p-4 border-t border-slate-800 shrink-0 text-center">
            <div className={cn('text-3xl font-mono font-bold', score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400')}>
              {score.toFixed(0)}%
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {Object.values(correctness).filter(v => v === true).length}/{hiddenNodes.length} correct
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 p-3">
        <FlowCanvas nodes={nodes} edges={edges} editable={false} showMinimap className="h-full" />
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────[...]
export default function StudyPage() {
  const params = useParams()
  const router = useRouter()
  const [diagram, setDiagram] = useState<DiagramRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ExamConfig | null>(null)

  useEffect(() => {
    setDiagram(getDiagram(params.id as string))
    setLoading(false)
  }, [params.id])

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 text-medical-blue animate-spin" /></div>
  if (!diagram) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-white">Diagram not found</p>
      <button onClick={() => router.push('/')} className="px-4 py-2 rounded-lg bg-medical-blue/20 border border-medical-blue/40 text-medical-blue text-sm">Back</button>
    </div>
  )

  if (!config) {
    return (
      <ExamSetup
        diagram={diagram}
        defaultMode='study'
        onStart={cfg => setConfig(cfg)}
        onBack={() => router.push('/')}
      />
    )
  }

  return (
    <ReactFlowProvider>
      <StudyCanvas diagram={diagram} config={config} onBack={() => setConfig(null)} />
    </ReactFlowProvider>
  )
}
