'use client'

import { useState, useMemo } from 'react'
import {
  FlaskConical, Timer, Shuffle, Eye, Pill, Gauge,
  GitBranch, LayoutGrid, CheckCircle, ChevronRight, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiagramRecord, HideCategory } from '@/lib/types'

export interface ExamConfig {
  hiddenNodeIds: string[]
  timedSeconds: number | null   // null = untimed
  mode: 'study' | 'exam'
}

interface ExamSetupProps {
  diagram: DiagramRecord
  onStart: (config: ExamConfig) => void
  onBack: () => void
  defaultMode?: 'study' | 'exam'
}

const CATEGORY_OPTIONS: {
  value: HideCategory
  label: string
  desc: string
  icon: React.ElementType
  color: string
}[] = [
  {
    value: 'medication',
    label: 'Medications',
    desc: 'Drug names, dosages, routes',
    icon: Pill,
    color: 'text-violet-400 border-violet-800/60 bg-violet-950/40',
  },
  {
    value: 'threshold',
    label: 'Thresholds',
    desc: 'Numerical cut-offs, scores, percentages',
    icon: Gauge,
    color: 'text-amber-400 border-amber-800/60 bg-amber-950/40',
  },
  {
    value: 'branch',
    label: 'Branch Labels',
    desc: 'Decision path labels (Yes/No/Grade)',
    icon: GitBranch,
    color: 'text-sky-400 border-sky-800/60 bg-sky-950/40',
  },
  {
    value: 'full',
    label: 'All Content',
    desc: 'Full node text hidden',
    icon: Eye,
    color: 'text-rose-400 border-rose-800/60 bg-rose-950/40',
  },
]

const TIMER_OPTIONS = [
  { label: 'No timer', value: null },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '15 min', value: 900 },
  { label: '20 min', value: 1200 },
  { label: '30 min', value: 1800 },
]

export default function ExamSetup({ diagram, onStart, onBack, defaultMode = 'exam' }: ExamSetupProps) {
  const [mode, setMode] = useState<'study' | 'exam'>(defaultMode)
  const [selectedCategories, setSelectedCategories] = useState<Set<HideCategory>>(
    () => {
      // Pre-select whatever categories are already configured in the diagram
      const cats = new Set<HideCategory>()
      diagram.nodes.forEach(n => {
        if (n.data.hideCategory !== 'none') cats.add(n.data.hideCategory)
      })
      return cats.size > 0 ? cats : new Set<HideCategory>(['medication', 'threshold'])
    }
  )
  const [randomPercent, setRandomPercent] = useState<number | null>(null)
  const [timedSeconds, setTimedSeconds] = useState<number | null>(null)

  // Compute which node IDs will be hidden based on selection
  const hiddenNodeIds = useMemo(() => {
    const byCategory = diagram.nodes
      .filter(n => n.data.hideCategory !== 'none' && selectedCategories.has(n.data.hideCategory))
      .map(n => n.id)

    if (randomPercent !== null) {
      // Take all non-start/end nodes and randomly hide some %
      const eligible = diagram.nodes
        .filter(n => n.data.nodeType !== 'start' && n.data.nodeType !== 'end')
        .map(n => n.id)
      const shuffled = [...eligible].sort(() => Math.random() - 0.5)
      const count = Math.ceil((randomPercent / 100) * eligible.length)
      return shuffled.slice(0, count)
    }

    return [...new Set(byCategory)]
  }, [diagram.nodes, selectedCategories, randomPercent])

  const toggleCategory = (cat: HideCategory) => {
    setRandomPercent(null)  // clear random mode
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const toggleRandom = (pct: number) => {
    if (randomPercent === pct) {
      setRandomPercent(null)
    } else {
      setRandomPercent(pct)
      setSelectedCategories(new Set())
    }
  }

  const nodeCount = diagram.nodes.length
  const hiddenCount = hiddenNodeIds.length

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-5 animate-slide-up">
        {/* Header */}
        <div>
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1 mb-4 transition-colors"
          >
            ← Back to library
          </button>
          <h1 className="text-xl font-bold text-white">{diagram.title}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {nodeCount} nodes — configure your session below
          </p>
        </div>

        {/* Mode */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {(['study', 'exam'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all',
                  mode === m
                    ? m === 'exam'
                      ? 'bg-rose-950/60 border-rose-700/60 text-white'
                      : 'bg-sky-950/60 border-sky-700/60 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {m === 'exam'
                    ? <FlaskConical className="w-3.5 h-3.5 text-rose-400" />
                    : <Eye className="w-3.5 h-3.5 text-sky-400" />}
                  <span className="text-sm font-semibold capitalize">{m}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {m === 'exam'
                    ? 'No hints. Correction only after submission.'
                    : 'Instant feedback as you answer.'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* What to hide */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Hide Fields
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map(opt => {
              const count = diagram.nodes.filter(n => n.data.hideCategory === opt.value).length
              if (count === 0) return null
              const active = selectedCategories.has(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleCategory(opt.value)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all relative',
                    active
                      ? opt.color
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                  )}
                >
                  {active && (
                    <CheckCircle className="w-3.5 h-3.5 absolute top-2.5 right-2.5 text-current opacity-60" />
                  )}
                  <div className="flex items-center gap-2 mb-0.5">
                    <opt.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="ml-auto text-[10px] font-mono opacity-60">{count}</span>
                  </div>
                  <p className="text-[10px] opacity-60 leading-relaxed">{opt.desc}</p>
                </button>
              )
            })}

            {/* Randomised */}
            {([25, 50, 75] as const).map(pct => (
              <button
                key={pct}
                onClick={() => toggleRandom(pct)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all',
                  randomPercent === pct
                    ? 'bg-teal-950/60 border-teal-700/60 text-teal-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                )}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Random {pct}%</span>
                </div>
                <p className="text-[10px] opacity-60">Random selection of nodes</p>
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Timer className="w-3 h-3" /> Timer
          </label>
          <div className="flex gap-2 flex-wrap">
            {TIMER_OPTIONS.map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => setTimedSeconds(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-mono transition-all',
                  timedSeconds === opt.value
                    ? 'bg-medical-blue/20 border-medical-blue/40 text-medical-blue'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary + Start */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-500 font-mono">
              {hiddenCount === 0
                ? '⚠ No fields selected to hide'
                : `${hiddenCount} field${hiddenCount !== 1 ? 's' : ''} hidden · ${nodeCount - hiddenCount} visible`}
              {timedSeconds && ` · ${Math.floor(timedSeconds / 60)} min`}
            </p>
          </div>
          <button
            onClick={() => onStart({ hiddenNodeIds, timedSeconds, mode })}
            disabled={hiddenCount === 0}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all',
              mode === 'exam'
                ? 'bg-rose-900/70 border border-rose-700/70 text-rose-200 hover:bg-rose-900/90 disabled:opacity-40'
                : 'bg-sky-900/70 border border-sky-700/70 text-sky-200 hover:bg-sky-900/90 disabled:opacity-40',
              'disabled:cursor-not-allowed'
            )}
          >
            Start {mode === 'exam' ? 'Exam' : 'Study'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
