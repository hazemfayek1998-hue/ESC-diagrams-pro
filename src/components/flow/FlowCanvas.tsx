'use client'

import {
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  type OnNodesChange, type OnEdgesChange, type OnConnect, type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes, examNodeTypes, type ESCFlowNode } from './CustomNodes'
import type { ESCEdge } from '@/lib/types'

interface FlowCanvasProps {
  nodes: ESCFlowNode[]
  edges: ESCEdge[]
  onNodesChange?: OnNodesChange<ESCFlowNode>
  onEdgesChange?: OnEdgesChange | ((...args: any[]) => void)
  onConnect?: OnConnect
  onNodeClick?: (node: ESCFlowNode) => void
  onPaneClick?: () => void
  showMinimap?: boolean
  editable?: boolean
  examMode?: boolean          // ← use exam-aware node types
  fitView?: boolean
  className?: string
}

export default function FlowCanvas({
  nodes, edges,
  onNodesChange, onEdgesChange, onConnect,
  onNodeClick, onPaneClick,
  showMinimap = true, editable = true, examMode = false,
  fitView = true, className = '',
}: FlowCanvasProps) {
  const handleNodeClick: NodeMouseHandler<ESCFlowNode> = (_, node) => onNodeClick?.(node)

  return (
    <div className={`w-full h-full rounded-xl overflow-hidden border border-[hsl(var(--border))] ${className}`}>
      <ReactFlow<ESCFlowNode, ESCEdge>
        nodes={nodes}
        edges={edges as any}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={examMode ? examNodeTypes : nodeTypes}
        fitView={fitView}
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        minZoom={0.1}
        maxZoom={3}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'hsl(201 96% 50% / 0.5)', strokeWidth: 2 },
          labelStyle: { fill: 'hsl(210 40% 80%)', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' },
          labelBgStyle: { fill: 'hsl(222 47% 12%)', fillOpacity: 0.9 },
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 3,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(215 28% 20%)" />
        <Controls showInteractive={false} />
        {showMinimap && (
          <MiniMap
            nodeColor={(n) => {
              const t = (n as ESCFlowNode).data?.nodeType ?? 'action'
              const colors: Record<string, string> = {
                start: '#22c55e', end: '#ef4444', decision: '#0ea5e9',
                action: '#64748b', condition: '#a855f7', info: '#f59e0b',
              }
              return colors[t as string] ?? '#64748b'
            }}
            maskColor="hsl(222 47% 7% / 0.7)"
            style={{ bottom: 16, right: 16 }}
          />
        )}
      </ReactFlow>
    </div>
  )
}
