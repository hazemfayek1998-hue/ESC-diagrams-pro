'use client'

import { useState, useCallback } from 'react'
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import FlowCanvas from '@/components/flow/FlowCanvas'
import { type ESCFlowNode } from '@/components/flow/CustomNodes'
import { applyDagreLayout, cn } from '@/lib/utils'
import {
  Edit3, Layout, Trash2, Check, X,
  Image as ImageIcon, Save, Plus, Layers, ChevronLeft,
} from 'lucide-react'
import type { ESCEdge, ESCNodeData, NodeType, HideCategory, StoredNode } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────
const HIDE_CATEGORIES: { value: HideCategory; label: string; color: string }[] = [
  { value: 'medication', label: 'Medications', color: 'text-violet-400' },
  { value: 'threshold', label: 'Thresholds', color: 'text-amber-400' },
  { value: 'branch', label: 'Branches', color: 'text-sky-400' },
  { value: 'full', label: 'Full Node', color: 'text-rose-400' },
]

const NODE_TYPES: NodeType[] = ['start', 'end', 'decision', 'action', 'condition', 'info']

// ─── Node Edit Panel ──────────────────────────────────────────────────────────
function NodeEditPanel({
  node, acceptedAnswers, onUpdate, onDelete, onClose,
}: {
  node: ESCFlowNode
  acceptedAnswers: string[]
  onUpdate: (id: string, data: Partial<ESCNodeData>, answers: string[]) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(node.data.label)
  const [nodeType, setNodeType] = useState<NodeType>(node.data.nodeType)
  const [hideCategory, setHideCategory] = useState<HideCategory>(node.data.hideCategory)
  const [answers, setAnswers] = useState<string[]>(
    acceptedAnswers.length > 0 ? acceptedAnswers : [node.data.originalLabel]
  )
  const [newAnswer, setNewAnswer] = useState('')

  const apply = () => {
    onUpdate(node.id, { label, nodeType, hideCategory }, answers)
    onClose()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Edit3 className="w-3.5 h-3.5 text-medical-blue" /> Edit Node
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Node Text</label>
          <textarea
            value={label}
            onChange={e => setLabel(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-medical-blue/60 resize-none"
          />
          <p className="text-xs text-slate-600 mt-1 font-mono truncate">Original: {node.data.originalLabel}</p>
        </div>

        {/* Node type */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Type</label>
          <div className="grid grid-cols-3 gap-1">
            {NODE_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setNodeType(t)}
                className={cn(
                  'px-2 py-1.5 rounded-md text-xs font-mono transition-all',
                  nodeType === t
                    ? 'bg-medical-blue/20 border border-medical-blue/40 text-medical-blue'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Hide category */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Hide In Exam</label>
          <div className="space-y-1">
            <button
              onClick={() => setHideCategory('none')}
              className={cn(
                'w-full px-3 py-1.5 rounded-md text-xs text-left transition-all',
                hideCategory === 'none'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              )}
            >
              Don't hide
            </button>
            {HIDE_CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setHideCategory(c.value)}
                className={cn(
                  'w-full px-3 py-1.5 rounded-md text-xs text-left flex items-center gap-2 transition-all',
                  hideCategory === c.value
                    ? 'bg-slate-800 border border-slate-600 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                )}
              >
                <span className={c.color}>●</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accepted answers */}
        {hideCategory !== 'none' && (
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Accepted Answers
            </label>
            <div className="space-y-1 mb-2">
              {answers.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-900 rounded-lg px-2 py-1">
                  <span className="flex-1 text-xs font-mono text-slate-200 break-all">{a}</span>
                  <button onClick={() => setAnswers(prev => prev.filter((_, j) => j !== i))} className="text-slate-600 hover:text-rose-400 shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newAnswer.trim()) {
                    setAnswers(prev => [...prev, newAnswer.trim()])
                    setNewAnswer('')
                  }
                }}
                placeholder="Add accepted answer..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-medical-blue/60"
              />
              <button
                onClick={() => { if (newAnswer.trim()) { setAnswers(prev => [...prev, newAnswer.trim()]); setNewAnswer('') } }}
                className="px-2 py-1.5 rounded-md bg-medical-blue/20 border border-medical-blue/40 text-medical-blue hover:bg-medical-blue/30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 flex gap-2">
        <button
          onClick={apply}
          className="flex-1 py-2 rounded-lg bg-medical-blue/20 border border-medical-blue/40 text-medical-blue text-sm font-medium hover:bg-medical-blue/30 flex items-center justify-center gap-1.5 transition-all"
        >
          <Check className="w-3.5 h-3.5" /> Apply
        </button>
        <button
          onClick={() => { if (confirm('Delete this node?')) onDelete(node.id) }}
          className="px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400 hover:bg-rose-950/80 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

interface DiagramEditorProps {
  initialNodes: StoredNode[]
  initialEdges: ESCEdge[]
  originalImageDataUrl?: string
  title: string
  acceptedAnswers?: Record<string, string[]>
  extractionNotes?: string
  onSave: (nodes: StoredNode[], edges: ESCEdge[], title: string, acceptedAnswers: Record<string, string[]>) => void
  onBack: () => void
}

function EditorInner({
  initialNodes, initialEdges, originalImageDataUrl, title: initialTitle,
  acceptedAnswers: initialAnswers = {}, extractionNotes, onSave, onBack,
}: DiagramEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ESCFlowNode>(
    initialNodes.map(n => ({ ...n, type: 'escNode' as const }))
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [title, setTitle] = useState(initialTitle)
  const [selectedNode, setSelectedNode] = useState<ESCFlowNode | null>(null)
  const [showOriginal, setShowOriginal] = useState(!!originalImageDataUrl)
  const [panel, setPanel] = useState<'node' | 'hide' | null>(null)
  const [acceptedAnswers, setAcceptedAnswers] = useState<Record<string, string[]>>(initialAnswers)

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, type: 'smoothstep' }, eds))
  }, [setEdges])

  const onNodeClick = useCallback((node: ESCFlowNode) => {
    setSelectedNode(node)
    setPanel('node')
  }, [])

  const updateNodeData = useCallback((id: string, data: Partial<ESCNodeData>, answers: string[]) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
    setAcceptedAnswers(prev => ({ ...prev, [id]: answers }))
    setSelectedNode(null)
    setPanel(null)
  }, [setNodes])

  const deleteNode = useCallback((id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    setSelectedNode(null)
    setPanel(null)
  }, [setNodes, setEdges])

  const autoLayout = () => setNodes(applyDagreLayout(nodes, edges))

  const toggleHideCategory = (category: HideCategory) => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, hideCategory: n.data.hideCategory === category ? 'none' : category },
    })))
  }

  const hiddenCount = nodes.filter(n => n.data.hideCategory !== 'none').length

  const handleSave = () => {
    const storedNodes: StoredNode[] = nodes.map(n => ({
      id: n.id,
      type: n.type ?? 'escNode',
      data: n.data,
      position: n.position,
      width: n.width,
      height: n.height,
    }))
    onSave(storedNodes, edges, title, acceptedAnswers)
  }

  return (
    <div className="flex h-screen bg-[hsl(222_47%_7%)]">
      {/* Sidebar */}
      <div className="w-[280px] shrink-0 border-r border-slate-800 flex flex-col bg-[hsl(222_47%_9%)]">
        <div className="p-4 border-b border-slate-800">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-medium focus:outline-none focus:border-medical-blue/60"
            placeholder="Diagram title..."
          />
        </div>

        <div className="p-3 border-b border-slate-800 space-y-1">
          <button onClick={autoLayout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <Layout className="w-3.5 h-3.5 text-medical-blue" /> Auto-layout
          </button>
          {originalImageDataUrl && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                showOriginal ? 'bg-medical-blue/15 text-medical-blue' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {showOriginal ? 'Hide' : 'Show'} Original
            </button>
          )}
          <button
            onClick={() => setPanel(panel === 'hide' ? null : 'hide')}
            className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              panel === 'hide' ? 'bg-medical-blue/15 text-medical-blue' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}
          >
            <Layers className="w-3.5 h-3.5" />
            Hide Config
            {hiddenCount > 0 && <span className="ml-auto bg-medical-blue/20 text-medical-blue text-xs px-1.5 rounded-full font-mono">{hiddenCount}</span>}
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden">
          {panel === 'node' && selectedNode && (
            <NodeEditPanel
              node={selectedNode}
              acceptedAnswers={acceptedAnswers[selectedNode.id] ?? []}
              onUpdate={updateNodeData}
              onDelete={deleteNode}
              onClose={() => { setPanel(null); setSelectedNode(null) }}
            />
          )}
          {panel === 'hide' && (
            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Toggle a category to apply to all nodes. Or click individual nodes to configure.
              </p>
              {HIDE_CATEGORIES.map(c => {
                const count = nodes.filter(n => n.data.hideCategory === c.value).length
                return (
                  <button
                    key={c.value}
                    onClick={() => toggleHideCategory(c.value)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm transition-all"
                  >
                    <span className={c.color}>●</span>
                    <span className="text-slate-300">{c.label}</span>
                    <span className={cn('ml-auto font-mono text-xs', count > 0 ? c.color : 'text-slate-600')}>
                      {count} node{count !== 1 ? 's' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          {!panel && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Click any node to edit its text, type, and hide settings. Drag to reposition.
              </p>
              {extractionNotes && (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40">
                  <p className="text-xs font-semibold text-amber-400 mb-1">⚠ AI Extraction Notes</p>
                  <p className="text-xs text-amber-300/80 font-mono leading-relaxed">{extractionNotes}</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-2">Node legend</p>
                {[
                  { type: 'start', color: 'bg-emerald-500', label: 'Start / Indication' },
                  { type: 'decision', color: 'bg-sky-400', label: 'Decision (diamond)' },
                  { type: 'action', color: 'bg-slate-400', label: 'Action / Treatment' },
                  { type: 'condition', color: 'bg-violet-400', label: 'Condition / Finding' },
                  { type: 'info', color: 'bg-amber-400', label: 'Info / Note' },
                  { type: 'end', color: 'bg-rose-400', label: 'End / Outcome' },
                ].map(({ type, color, label }) => (
                  <div key={type} className="flex items-center gap-2 py-0.5">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-xs text-slate-400 font-mono">{type}</span>
                    <span className="text-xs text-slate-600">— {label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-sm font-medium hover:bg-emerald-900/80 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save & Continue
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className={cn('flex-1 flex overflow-hidden', showOriginal ? 'flex-row' : '')}>
        <div className={cn('flex-1 p-4', showOriginal ? 'w-1/2' : '')}>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={() => { setSelectedNode(null); setPanel(null) }}
            className="h-full"
          />
        </div>
        {showOriginal && originalImageDataUrl && (
          <div className="w-1/2 p-4 border-l border-slate-800 overflow-hidden">
            <div className="h-full rounded-xl border border-slate-700 overflow-auto bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalImageDataUrl} alt="Original ESC guideline diagram" className="w-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DiagramEditor(props: DiagramEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  )
}
