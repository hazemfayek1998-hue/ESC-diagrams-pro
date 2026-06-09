'use client'

import { useState, useEffect } from 'react'
import { X, Key, Eye, EyeOff, CheckCircle, ExternalLink } from 'lucide-react'
import { getSettings, saveSettings } from '@/lib/storage'

export default function ApiKeyModal({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = getSettings()
    if (s.apiKey) setKey(s.apiKey)
  }, [])

  const save = () => {
    saveSettings({ apiKey: key.trim() })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[hsl(222_47%_10%)] border border-[hsl(var(--border))] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-medical-blue/15 border border-medical-blue/30 flex items-center justify-center">
              <Key className="w-4 h-4 text-medical-blue" />
            </div>
            <h2 className="text-base font-semibold text-white">Anthropic API Key</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          Your API key is stored locally in your browser and never sent anywhere except directly to Anthropic for diagram extraction.
        </p>

        <div className="relative mb-4">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="sk-ant-api03-..."
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
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-medical-blue/70 hover:text-medical-blue mb-5 transition-colors w-fit"
        >
          <ExternalLink className="w-3 h-3" />
          Get your API key from Anthropic Console
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
          ) : 'Save API Key'}
        </button>
      </div>
    </div>
  )
}
