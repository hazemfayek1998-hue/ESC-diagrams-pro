'use client'

import { useState, useEffect } from 'react'
import { X, Key, Eye, EyeOff, CheckCircle, ExternalLink, ChevronDown } from 'lucide-react'
import { getSettings, saveSettings } from '@/lib/storage'
import { AIProvider, PROVIDER_META } from '@/lib/types'

const PROVIDER_ORDER: AIProvider[] = ['gemini', 'anthropic', 'openai', 'groq']

export default function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState<AIProvider>('gemini')
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = getSettings()
    if (s.aiProvider) setProvider(s.aiProvider)
    if (s.apiKey) setKey(s.apiKey)
  }, [])

  const save = () => {
    saveSettings({ aiProvider: provider, apiKey: key.trim() })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  const meta = PROVIDER_META[provider]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[hsl(222_47%_10%)] border border-[hsl(var(--border))] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-medical-blue/15 border border-medical-blue/30 flex items-center justify-center">
              <Key className="w-4 h-4 text-medical-blue" />
            </div>
            <h2 className="text-base font-semibold text-white">AI Provider Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          Choose an AI provider for diagram extraction. Each has a free tier — Gemini 1.5 Flash is the best value.
        </p>

        {/* Provider selector */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2 block">
            AI Provider
          </label>
          <div className="relative">
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as AIProvider)}
              className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-medical-blue/60 pr-10 cursor-pointer"
            >
              {PROVIDER_ORDER.map(p => (
                <option key={p} value={p}>
                  {PROVIDER_META[p].name} — {PROVIDER_META[p].freeTier}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Provider badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-mono ${meta.color}`}>
            {meta.name} · {meta.model}
          </span>
        </div>

        {/* API Key input */}
        <div className="relative mb-3">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder={meta.keyPlaceholder}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-medical-blue/60 pr-10"
          />
          <button
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <a
          href={meta.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-medical-blue/70 hover:text-medical-blue mb-5 transition-colors w-fit"
        >
          <ExternalLink className="w-3 h-3" />
          Get API key from {meta.name}
        </a>

        <button
          onClick={save}
          disabled={!key.trim()}
          className="w-full py-2.5 rounded-lg bg-medical-blue/20 border border-medical-blue/40 text-medical-blue font-medium text-sm hover:bg-medical-blue/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Saved!</span>
            </>
          ) : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}