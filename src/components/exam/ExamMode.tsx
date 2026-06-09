'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  type DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { type ESCFlowNode } from '@/components/flow/CustomNodes'
import FlowCanvas from '@/components/flow/FlowCanvas'
import { isAnswerCorrect, cn } from '@/lib/utils'
import { useTimer } from '@/hooks/useTimer'
import { CheckCircle, XCircle, Send, RotateCcw, ChevronLeft, Timer, AlertTriangle } from 'lucide-react'
import type { DiagramRecord, ExamResults, ESCEdge } from '@/lib/types'
import type { ExamConfig } from './ExamSetup'

// ─── Timer bar ────────────────────────────────────────────────────────────────
function TimerBar({ timer, onExpire }: { timer: ReturnType<typeof useTimer>; onExpire: () => void }) {
  useEffect(() => { if (timer.isExpired) onExpire() }, [timer.isExpired, onExpire])
  const urgent = timer.percentLeft < 20
  const warning = timer.percentLeft < 40
  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn('flex items-center gap-1.5 text-sm font-mono font-semibold', urgent ? 'text-rose-400' : warning ? 'text-amber-400' : 'text-slate-300')}>
          <Timer className="w-3.5 h-3.5" />{timer.formatted}
        </span>
        {urgent && <span className="text-xs text-rose-400 font-mono animate-pulse">Almost up!</span>}
      </div>
      <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-1000', urgent ? 'bg-rose-500' : warning ? 'bg-amber-500' : 'bg-medical-blue')} style={{ width: `${timer.percentLeft}%` }} />
      </div>
    </div>
  )
}

// ─── Draggable chip ───────────────────────────────────────────────────────────
function AnswerChip({ id, label, placed }: { id: string; label: string; placed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled: placed })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn(
        'px-2.5 py-1.5 rounded-lg border text-xs font-mono select-none transition-all leading-relaxed',
        isDragging ? 'opacity-40 scale-95 cursor-grabbing' : '',
        placed ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-default' : 'bg-slate-800 border-slate-600 text-slate-200 hover:border-medical-blue/50 hover:bg-slate-700 cursor-grab'
      )}
    >
      {label}
    </div>
  )
}

// ─── Sidebar slot (droppable + typeable) ─────────────────────────────────────
function SidebarSlot({ nodeId, nodeLabel, currentAnswer, onTextInput, onClear, mode }: {
  nodeId: string; nodeLabel: string; currentAnswer?: string
  onTextInput: (id: string, v: string) => void; onClear: (id: string) => void
  mode: 'study' | 'exam'
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `sidebar_${nodeId}` })
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(currentAnswer ?? '')
  useEffect(() => { if (!editing) setVal(currentAnswer ?? '') }, [currentAnswer, editing])

  return (
    <div ref={setNodeRef} className={cn('rounded-lg border p-2 transition-all', isOver ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/40')}>
      {mode === 'study' && <p className="text-[10px] text-slate-500 font-mono mb-1 truncate leading-tight">{nodeLabel}</p>}
      {editing ? (
        <input autoFocus value={val} onChange={e => setVal(e.target.value)}
          onBlur={() => { onTextInput(nodeId, val); setEditing(false) }}
          onKeyDown={e => { if (e.key === 'Enter') { onTextInput(nodeId, val); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
          className="w-full bg-slate-800 border border-medical-blue/40 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none" />
      ) : (
        <div onClick={() => setEditing(true)} className={cn(
          'min-h-[28px] rounded px-2 py-1 text-xs font-mono flex items-center gap-2 cursor-text transition-all',
          currentAnswer ? 'bg-sky-950/40 border border-sky-800/40 text-sky-200' : 'border border-dashed border-slate-700 text-slate-600 hover:border-slate-500'
        )}>
          <span className="flex-1 truncate">{currentAnswer || '— click or drop —'}</span>
          {currentAnswer && <button onClick={e => { e.stopPropagation(); onClear(nodeId) }} className="text-slate-500 hover:text-slate-300 shrink-0 text-base leading-none">×</button>}
        </div>
      )}
    </div>
  )
}

// ─── Results panel ────────────────────────────────────────────────────────────
function ResultsPanel({ results, timedOut, onRetry, onRetryWrong }: {
  results: ExamResults; timedOut: boolean; onRetry: () => void; onRetryWrong: () => void
}) {
  const pct = results.score
  const color = pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'
  const wrongNodes = results.nodeResults.filter(r => !r.isCorrect)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {timedOut && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Time expired — auto-submitted
        </div>
      )}
      <div className="text-center py-2">
        <div className={cn('text-5xl font-mono font-bold mb-1', color)}>{pct.toFixed(0)}%</div>
        <p className="text-slate-400 text-sm">{results.correctCount}/{results.totalQuestions} correct{results.unansweredCount > 0 && ` · ${results.unansweredCount} skipped`}</p>
        {results.timeTakenSeconds !== undefined && (
          <p className="text-slate-600 text-xs font-mono mt-1">{Math.floor(results.timeTakenSeconds / 60)}m {results.timeTakenSeconds % 60}s</p>
        )}
      </div>

      <div className="space-y-1.5">
        {results.nodeResults.map(r => (
          <div key={r.nodeId} className={cn('flex items-start gap-2.5 p-2.5 rounded-lg border text-xs', r.isCorrect ? 'bg-emerald-950/25 border-emerald-900/40' : 'bg-rose-950/25 border-rose-900/40')}>
            {r.isCorrect ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
            <div className="min-w-0 flex-1">
              <p className="text-slate-200 font-mono leading-snug break-words">{r.label}</p>
              {!r.isCorrect && r.userAnswer && <p className="text-rose-400 font-mono mt-0.5 break-words">✗ {r.userAnswer}</p>}
              {!r.isCorrect && !r.userAnswer && <p className="text-slate-600 font-mono mt-0.5 italic">not answered</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pb-4">
        {wrongNodes.length > 0 && (
          <button onClick={onRetryWrong} className="w-full py-2.5 rounded-xl bg-amber-950/50 border border-amber-800/50 text-amber-300 text-sm font-medium hover:bg-amber-950/70 flex items-center justify-center gap-2 transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> Retry {wrongNodes.length} incorrect
          </button>
        )}
        <button onClick={onRetry} className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-700 flex items-center justify-center gap-2 transition-all">
          <RotateCcw className="w-3.5 h-3.5" /> Full retry
        </button>
      </div>
    </div>
  )
}

// ─── Exam inner ───────────────────────────────────────────────────────────────
interface ExamModeProps {
  diagram: DiagramRecord; config: ExamConfig
  onBack: () => void; onComplete: (r: ExamResults) => void
}

function ExamInner({ diagram, config, onBack, onComplete }: ExamModeProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<ExamResults | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [activeChipLabel, setActiveChipLabel] = useState<string | null>(null)
  const [startTime] = useState(Date.now())

  const hiddenIds = useMemo(() => new Set(config.hiddenNodeIds), [config.hiddenNodeIds])
  const hiddenNodes = useMemo(() => diagram.nodes.filter(n => hiddenIds.has(n.id)), [diagram.nodes, hiddenIds])
  const shuffledBank = useMemo(() => hiddenNodes.map(n => ({ id: `chip__${n.id}`, label: n.data.originalLabel, nodeId: n.id })).sort(() => Math.random() - 0.5), []) // eslint-disable-line react-hooks/exhaustive-deps

  const timer = useTimer(config.timedSeconds)
  useEffect(() => { if (config.timedSeconds !== null) timer.start() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const flowNodes = useMemo<ESCFlowNode[]>(() => diagram.nodes.map(n => {
    const isHid = hiddenIds.has(n.id)
    const userAns = userAnswers[n.id]
    const accepted = diagram.acceptedAnswers[n.id] ?? [n.data.originalLabel]
    const wasAnswered = submitted && isHid
    return {
      ...n, type: 'escNode' as const,
      data: {
        ...n.data,
        isHidden: isHid && !submitted,
        label: submitted ? n.data.originalLabel : isHid ? (userAns ?? '') : n.data.label,
        userAnswer: userAns,
        wasAnswered,
        isCorrect: wasAnswered ? isAnswerCorrect(userAns ?? '', accepted) : undefined,
      },
    }
  }), [diagram.nodes, hiddenIds, userAnswers, submitted, diagram.acceptedAnswers])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveChipLabel(null)
    const { over, active } = e
    if (!over) return
    const overId = String(over.id)
    const targetNodeId = overId.startsWith('sidebar_') ? overId.replace('sidebar_', '') : overId
    if (!hiddenIds.has(targetNodeId)) return
    const chip = shuffledBank.find(c => c.id === String(active.id))
    if (chip) setUserAnswers(prev => ({ ...prev, [targetNodeId]: chip.label }))
  }, [shuffledBank, hiddenIds])

  const handleTextInput = useCallback((id: string, text: string) => setUserAnswers(prev => ({ ...prev, [id]: text.trim() })), [])
  const handleClear = useCallback((id: string) => setUserAnswers(prev => { const n = { ...prev }; delete n[id]; return n }), [])

  const doSubmit = useCallback((expired = false) => {
    if (submitted) return
    const nodeResults = hiddenNodes.map(n => {
      const userAnswer = userAnswers[n.id] ?? ''
      const accepted = diagram.acceptedAnswers[n.id] ?? [n.data.originalLabel]
      return { nodeId: n.id, label: n.data.originalLabel, userAnswer, isCorrect: isAnswerCorrect(userAnswer, accepted), acceptedAnswers: accepted }
    })
    const correctCount = nodeResults.filter(r => r.isCorrect).length
    const unansweredCount = nodeResults.filter(r => !r.userAnswer).length
    const examResults: ExamResults = {
      score: hiddenNodes.length > 0 ? (correctCount / hiddenNodes.length) * 100 : 100,
      totalQuestions: hiddenNodes.length, correctCount,
      incorrectCount: nodeResults.filter(r => !r.isCorrect && !!r.userAnswer).length,
      unansweredCount, nodeResults, completedAt: new Date().toISOString(),
      timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
    }
    if (expired) setTimedOut(true)
    setResults(examResults); setSubmitted(true); onComplete(examResults)
  }, [submitted, hiddenNodes, userAnswers, diagram.acceptedAnswers, startTime, onComplete])

  const handleExpire = useCallback(() => doSubmit(true), [doSubmit])

  const reset = useCallback(() => {
    setUserAnswers({}); setSubmitted(false); setResults(null); setTimedOut(false)
    timer.reset(); if (config.timedSeconds !== null) timer.start()
  }, [timer, config.timedSeconds])

  const retryWrong = useCallback(() => {
    if (!results) return
    const keepAnswers: Record<string, string> = {}
    results.nodeResults.filter(r => r.isCorrect).forEach(r => { keepAnswers[r.nodeId] = r.userAnswer })
    setUserAnswers(keepAnswers); setSubmitted(false); setResults(null); setTimedOut(false)
    timer.reset(); if (config.timedSeconds !== null) timer.start()
  }, [results, timer, config.timedSeconds])

  const answeredCount = Object.values(userAnswers).filter(Boolean).length

  return (
    <DndContext sensors={sensors} onDragStart={(e: any) => { const chip = shuffledBank.find(c => c.id === String(e.active.id)); setActiveChipLabel(chip?.label ?? null) }} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden bg-[hsl(222_47%_7%)]">
        {/* Sidebar */}
        <div className="w-[300px] shrink-0 border-r border-slate-800 flex flex-col bg-[hsl(222_47%_9%)] overflow-hidden">
          <div className="p-4 border-b border-slate-800 shrink-0">
            <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs mb-3 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Library
            </button>
            <h2 className="text-white font-semibold text-sm line-clamp-2 leading-snug">{diagram.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-mono', config.mode === 'exam' ? 'bg-rose-950/60 border-rose-800/60 text-rose-300' : 'bg-sky-950/60 border-sky-800/60 text-sky-300')}>
                {config.mode === 'exam' ? '🔒 EXAM' : '📖 STUDY'}
              </span>
              {!submitted && <span className="text-xs text-slate-500 font-mono ml-auto">{answeredCount}/{hiddenNodes.length}</span>}
            </div>
          </div>

          {config.timedSeconds !== null && !submitted && (
            <div className="shrink-0 border-b border-slate-800">
              <TimerBar timer={timer} onExpire={handleExpire} />
            </div>
          )}

          {submitted && results ? (
            <ResultsPanel results={results} timedOut={timedOut} onRetry={reset} onRetryWrong={retryWrong} />
          ) : (
            <>
              <div className="shrink-0 p-3 border-b border-slate-800">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Answer Bank</p>
                {hiddenNodes.length === 0
                  ? <p className="text-slate-600 text-xs py-1">No hidden fields — configure in editor.</p>
                  : <div className="flex flex-wrap gap-1.5">{shuffledBank.map(chip => <AnswerChip key={chip.id} id={chip.id} label={chip.label} placed={!!userAnswers[chip.nodeId]} />)}</div>
                }
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Blank Slots</p>
                {hiddenNodes.map(n => (
                  <SidebarSlot key={n.id} nodeId={n.id}
                    nodeLabel={config.mode === 'study' ? n.data.originalLabel : `Slot ${hiddenNodes.indexOf(n) + 1}`}
                    currentAnswer={userAnswers[n.id]} mode={config.mode}
                    onTextInput={handleTextInput} onClear={handleClear}
                  />
                ))}
              </div>

              <div className="p-4 border-t border-slate-800 shrink-0">
                {config.mode === 'exam' && <p className="text-[10px] text-slate-600 font-mono text-center mb-2">🔒 No hints until submission</p>}
                <button onClick={() => doSubmit(false)} disabled={hiddenNodes.length === 0}
                  className={cn('w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border disabled:opacity-40 disabled:cursor-not-allowed',
                    config.mode === 'exam' ? 'bg-rose-900/60 border-rose-700/60 text-rose-200 hover:bg-rose-900/80' : 'bg-sky-900/60 border-sky-700/60 text-sky-200 hover:bg-sky-900/80')}>
                  <Send className="w-3.5 h-3.5" />
                  {config.mode === 'exam' ? 'Submit & Reveal' : 'Check Answers'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 p-3 overflow-hidden">
          <FlowCanvas nodes={flowNodes} edges={diagram.edges as ESCEdge[]} editable={false} showMinimap examMode className="h-full" />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeChipLabel && (
          <div className="px-3 py-1.5 rounded-lg border bg-slate-700 border-medical-blue/60 text-xs font-mono text-white shadow-2xl cursor-grabbing">
            {activeChipLabel}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default function ExamMode(props: ExamModeProps) {
  return <ReactFlowProvider><ExamInner {...props} /></ReactFlowProvider>
}
