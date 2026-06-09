'use client'

import { useRef, useState } from 'react'
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { exportLibrary, importLibrary } from '@/lib/storage'

interface LibraryActionsProps {
  onImportDone: () => void
}

export default function LibraryActions({ onImportDone }: LibraryActionsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const handleExport = () => {
    const json = exportLibrary()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `esc-study-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus({ type: 'ok', msg: 'Library exported' })
    setTimeout(() => setStatus(null), 3000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const { count, errors } = importLibrary(reader.result as string)
      if (errors.length > 0) {
        setStatus({ type: 'err', msg: `${errors.length} errors — ${count} imported` })
      } else {
        setStatus({ type: 'ok', msg: `${count} diagram${count !== 1 ? 's' : ''} imported` })
        onImportDone()
      }
      setTimeout(() => setStatus(null), 4000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      {status && (
        <span className={`flex items-center gap-1.5 text-xs font-mono ${status.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {status.type === 'ok' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {status.msg}
        </span>
      )}
      <button
        onClick={handleExport}
        title="Export library as JSON backup"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white transition-all"
      >
        <Download className="w-3 h-3" /> Export
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        title="Import JSON backup"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white transition-all"
      >
        <Upload className="w-3 h-3" /> Import
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  )
}
