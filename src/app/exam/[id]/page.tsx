'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ExamSetup, { type ExamConfig } from '@/components/exam/ExamSetup'
import ExamMode from '@/components/exam/ExamMode'
import { getDiagram, updateDiagramStats } from '@/lib/storage'
import { Loader2 } from 'lucide-react'
import type { DiagramRecord, ExamResults } from '@/lib/types'

type Phase = 'setup' | 'exam'

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const [diagram, setDiagram] = useState<DiagramRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('setup')
  const [config, setConfig] = useState<ExamConfig | null>(null)

  useEffect(() => {
    setDiagram(getDiagram(params.id as string))
    setLoading(false)
  }, [params.id])

  const handleStart = (cfg: ExamConfig) => {
    setConfig(cfg)
    setPhase('exam')
  }

  const handleComplete = (results: ExamResults) => {
    updateDiagramStats(params.id as string, results.score)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-medical-blue animate-spin" />
      </div>
    )
  }

  if (!diagram) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white font-semibold">Diagram not found</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 rounded-lg bg-medical-blue/20 border border-medical-blue/40 text-medical-blue text-sm">
          Back to Library
        </button>
      </div>
    )
  }

  if (phase === 'setup') {
    return (
      <ExamSetup
        diagram={diagram}
        onStart={handleStart}
        onBack={() => router.push('/')}
      />
    )
  }

  return (
    <ExamMode
      diagram={diagram}
      config={config!}
      onBack={() => setPhase('setup')}
      onComplete={handleComplete}
    />
  )
}
