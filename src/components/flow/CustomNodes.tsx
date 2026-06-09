'use client'

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { ESCNodeData, NodeType } from '@/lib/types'

export type ESCFlowNode = Node<ESCNodeData, 'escNode'>

// ─── Per-type design tokens ───────────────────────────────────────────────────
const TYPE_CONFIG: Record<NodeType, {
  bg: string; border: string; text: string; ring: string
  shape: 'rect' | 'oval' | 'diamond'
}> = {
  start:     { bg: 'bg-emerald-950/70', border: 'border-emerald-500/70', text: 'text-emerald-200', ring: 'ring-emerald-500/40', shape: 'oval' },
  end:       { bg: 'bg-rose-950/70',    border: 'border-rose-500/60',    text: 'text-rose-200',    ring: 'ring-rose-500/40',    shape: 'oval' },
  decision:  { bg: 'bg-sky-950/70',     border: 'border-sky-400/70',     text: 'text-sky-100',     ring: 'ring-sky-400/40',     shape: 'diamond' },
  action:    { bg: 'bg-slate-800/90',   border: 'border-slate-500/60',   text: 'text-slate-100',   ring: 'ring-slate-400/30',   shape: 'rect' },
  condition: { bg: 'bg-violet-950/70',  border: 'border-violet-500/60',  text: 'text-violet-100',  ring: 'ring-violet-500/40',  shape: 'rect' },
  info:      { bg: 'bg-amber-950/50',   border: 'border-amber-500/40',   text: 'text-amber-200',   ring: 'ring-amber-500/30',   shape: 'rect' },
}

// ─── Hidden slot content ──────────────────────────────────────────────────────
function HiddenSlotContent({
  userAnswer, textColor, isOver,
}: { userAnswer?: string; textColor: string; isOver?: boolean }) {
  return (
    <div className={cn(
      'min-h-[26px] min-w-[90px] flex items-center justify-center px-1 rounded transition-colors',
      isOver && !userAnswer ? 'bg-emerald-500/10' : '',
    )}>
      {userAnswer ? (
        <span className={cn('text-xs font-mono leading-snug break-words text-center', textColor)}>
          {userAnswer}
        </span>
      ) : (
        <span className={cn(
          'text-[10px] font-mono tracking-wide transition-colors',
          isOver ? 'text-emerald-400' : 'text-slate-500',
        )}>
          {isOver ? '↓ drop here' : '[ drop or type ]'}
        </span>
      )}
    </div>
  )
}

// ─── SVG Diamond ─────────────────────────────────────────────────────────────
function DiamondNode({
  data, selected, cfg, isHiddenExam, isCorrect, isWrong, isOver,
}: {
  data: ESCNodeData; selected: boolean; cfg: typeof TYPE_CONFIG[NodeType]
  isHiddenExam: boolean; isCorrect: boolean; isWrong: boolean; isOver?: boolean
}) {
  const W = 200
  const H = 120

  const strokeColor = isCorrect ? '#34d399'
    : isWrong ? '#f87171'
    : isOver ? '#4ade80'           // emerald-400 on hover
    : isHiddenExam ? '#38bdf8'
    : '#38bdf8'

  const fillClass = isCorrect ? 'fill-emerald-950/80'
    : isWrong ? 'fill-rose-950/80'
    : isOver ? 'fill-emerald-950/40'
    : isHiddenExam ? 'fill-slate-950/90'
    : 'fill-sky-950/70'

  return (
    <div className="relative" style={{ width: W, height: H }}>
      <Handle type="target" position={Position.Top}   style={{ top: 0, left: '50%' }}    className="!w-2.5 !h-2.5 !-translate-x-1/2" />
      <Handle type="source" position={Position.Bottom} style={{ bottom: 0, left: '50%' }} className="!w-2.5 !h-2.5 !-translate-x-1/2" />
      <Handle type="source" position={Position.Left}   id="left"  style={{ left: 0, top: '50%' }}   className="!w-2.5 !h-2.5 !-translate-y-1/2" />
      <Handle type="source" position={Position.Right}  id="right" style={{ right: 0, top: '50%' }}  className="!w-2.5 !h-2.5 !-translate-y-1/2" />

      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 pointer-events-none" width={W} height={H}>
        <polygon points={`${W/2},4 ${W-4},${H/2} ${W/2},${H-4} 4,${H/2}`} className={cn('transition-all', fillClass)} />
        <polygon
          points={`${W/2},4 ${W-4},${H/2} ${W/2},${H-4} 4,${H/2}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={selected || isOver ? 2.5 : 1.5}
          strokeDasharray={isHiddenExam && !isOver ? '5,3' : undefined}
          opacity={selected || isOver ? 1 : 0.7}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '14px 28px' }}>
        {isHiddenExam ? (
          <HiddenSlotContent userAnswer={data.userAnswer as string | undefined} textColor={cfg.text} isOver={isOver} />
        ) : (
          <div className={cn('text-xs font-mono leading-snug text-center break-words', cfg.text)}>
            {String(data.label)}
          </div>
        )}
      </div>

      {data.wasAnswered && (
        <div className={cn(
          'absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono px-1.5 py-0.5 rounded',
          isCorrect ? 'text-emerald-400 bg-emerald-950/70' : 'text-rose-400 bg-rose-950/70',
        )}>
          {isCorrect ? '✓' : `✗ ${String(data.originalLabel).slice(0, 22)}`}
        </div>
      )}
    </div>
  )
}

// ─── Rect / oval inner body ───────────────────────────────────────────────────
function RectBody({
  data, cfg, selected, isHiddenExam, isCorrect, isWrong, isOver,
}: {
  data: ESCNodeData; cfg: typeof TYPE_CONFIG[NodeType]; selected: boolean
  isHiddenExam: boolean; isCorrect: boolean; isWrong: boolean; isOver?: boolean
}) {
  return (
    <div className={cn(
      'border px-4 py-2.5 transition-all duration-150',
      cfg.shape === 'oval' ? 'rounded-full text-center px-5' : 'rounded-xl',
      cfg.bg, cfg.border,
      selected ? `ring-2 ${cfg.ring}` : '',
      isHiddenExam && !isOver ? '!bg-slate-900/90 !border-dashed !border-sky-500/60 exam-hidden-slot' : '',
      isHiddenExam &&  isOver ? '!bg-emerald-950/40 !border-emerald-400/80 !border-solid shadow-[0_0_12px_rgba(74,222,128,0.2)]' : '',
      isCorrect ? '!bg-emerald-950/80 !border-emerald-400/70 result-correct ring-2 ring-emerald-500/30' : '',
      isWrong   ? '!bg-rose-950/80 !border-rose-400/70 ring-2 ring-rose-500/30' : '',
    )}>
      {isHiddenExam ? (
        <HiddenSlotContent userAnswer={data.userAnswer as string | undefined} textColor={cfg.text} isOver={isOver} />
      ) : (
        <div className={cn('text-sm font-mono leading-snug select-none', cfg.shape === 'oval' ? 'text-center' : '', cfg.text)}>
          {String(data.label)}
        </div>
      )}

      {data.wasAnswered && (
        <div className={cn(
          'mt-1.5 text-xs font-mono border-t pt-1',
          isCorrect ? 'text-emerald-400 border-emerald-900' : 'text-rose-400 border-rose-900',
        )}>
          {isCorrect ? '✓ correct' : `✗ ${String(data.originalLabel)}`}
        </div>
      )}
    </div>
  )
}

// ─── Base node (no dnd, used in editor + study canvas) ───────────────────────
export function ESCNodeComponent({ data, selected }: NodeProps<ESCFlowNode>) {
  const nodeType: NodeType = (data.nodeType as NodeType) ?? 'action'
  const cfg = TYPE_CONFIG[nodeType] ?? TYPE_CONFIG.action
  const isHiddenExam = !!data.isHidden && !data.wasAnswered
  const isCorrect    = data.isCorrect === true
  const isWrong      = !!data.wasAnswered && data.isCorrect === false

  if (cfg.shape === 'diamond') {
    return <DiamondNode data={data} selected={!!selected} cfg={cfg} isHiddenExam={isHiddenExam} isCorrect={isCorrect} isWrong={isWrong} />
  }

  return (
    <div className={cn('relative', cfg.shape === 'oval' ? 'min-w-[140px]' : 'min-w-[160px] max-w-[260px]')}>
      <Handle type="target" position={Position.Top}    className="!w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5" />
      <RectBody data={data} cfg={cfg} selected={!!selected} isHiddenExam={isHiddenExam} isCorrect={isCorrect} isWrong={isWrong} />
    </div>
  )
}

// ─── Exam node (with dnd-kit useDroppable, used only inside DndContext) ───────
export function ExamESCNodeComponent({ id, data, selected }: NodeProps<ESCFlowNode>) {
  const isHiddenExam = !!data.isHidden && !data.wasAnswered

  // Always call hook — disabled when not a hidden exam slot
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !isHiddenExam })

  const nodeType: NodeType = (data.nodeType as NodeType) ?? 'action'
  const cfg = TYPE_CONFIG[nodeType] ?? TYPE_CONFIG.action
  const isCorrect = data.isCorrect === true
  const isWrong   = !!data.wasAnswered && data.isCorrect === false

  if (cfg.shape === 'diamond') {
    return (
      // Wrap diamond in a ref div so dnd-kit can detect hover
      <div ref={isHiddenExam ? setNodeRef : undefined}>
        <DiamondNode data={data} selected={!!selected} cfg={cfg}
          isHiddenExam={isHiddenExam} isCorrect={isCorrect} isWrong={isWrong}
          isOver={isOver && isHiddenExam}
        />
      </div>
    )
  }

  return (
    <div
      ref={isHiddenExam ? setNodeRef : undefined}
      className={cn('relative', cfg.shape === 'oval' ? 'min-w-[140px]' : 'min-w-[160px] max-w-[260px]')}
    >
      <Handle type="target" position={Position.Top}    className="!w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5" />
      <RectBody data={data} cfg={cfg} selected={!!selected}
        isHiddenExam={isHiddenExam} isCorrect={isCorrect} isWrong={isWrong}
        isOver={isOver && isHiddenExam}
      />
    </div>
  )
}

// ─── nodeTypes maps ───────────────────────────────────────────────────────────
export const nodeTypes     = { escNode: ESCNodeComponent     } as const
export const examNodeTypes = { escNode: ExamESCNodeComponent } as const
