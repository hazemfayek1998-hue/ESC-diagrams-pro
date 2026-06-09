'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, ImageIcon, Link2, X, AlertCircle } from 'lucide-react'
import { cn, fileToBase64 } from '@/lib/utils'

interface UploadZoneProps {
  onImageReady: (base64: string, mediaType: string, fileName?: string) => void
  onUrlSubmit?: (url: string) => void
  loading?: boolean
  className?: string
}

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']

export default function UploadZone({
  onImageReady,
  onUrlSubmit,
  loading = false,
  className,
}: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [urlMode, setUrlMode] = useState(false)
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or PDF file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large. Max 20 MB.')
      return
    }
    try {
      const base64 = await fileToBase64(file)
      if (file.type !== 'application/pdf') setPreview(base64)
      onImageReady(base64, file.type, file.name)
    } catch {
      setError('Failed to read file.')
    }
  }, [onImageReady])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleUrlSubmit = () => {
    if (!url.trim()) return
    onUrlSubmit?.(url.trim())
  }

  const clear = () => {
    setPreview(null)
    setError(null)
    setUrl('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-slate-900 rounded-lg w-fit">
        <button
          onClick={() => setUrlMode(false)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
            !urlMode
              ? 'bg-medical-blue/20 text-medical-blue border border-medical-blue/30'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Upload Image / PDF
        </button>
        {onUrlSubmit && (
          <button
            onClick={() => setUrlMode(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
              urlMode
                ? 'bg-medical-blue/20 text-medical-blue border border-medical-blue/30'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Link2 className="w-3.5 h-3.5" />
            Paste URL
          </button>
        )}
      </div>

      {/* Upload zone */}
      {!urlMode && (
        <>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="max-h-64 w-full object-contain bg-slate-900" />
              <button
                onClick={clear}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
                dragging
                  ? 'border-medical-blue bg-medical-blue/5 scale-[1.01]'
                  : 'border-slate-700 hover:border-slate-500 hover:bg-slate-900/50',
                loading ? 'pointer-events-none opacity-60' : '',
              )}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED.join(',')}
                onChange={onInputChange}
              />
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center border transition-colors',
                  dragging
                    ? 'bg-medical-blue/20 border-medical-blue/40'
                    : 'bg-slate-800 border-slate-700',
                )}>
                  <Upload className={cn('w-5 h-5', dragging ? 'text-medical-blue' : 'text-slate-400')} />
                </div>
                <div>
                  <p className="text-slate-300 font-medium">
                    {dragging ? 'Drop to upload' : 'Drop ESC diagram here'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    JPEG, PNG, WebP, or PDF — max 20 MB
                  </p>
                </div>
                <p className="text-xs text-medical-blue/70 font-mono">
                  or click to browse
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* URL input */}
      {urlMode && (
        <div className="flex gap-2">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://www.escardio.org/guidelines/..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-medical-blue/60"
          />
          <button
            onClick={handleUrlSubmit}
            disabled={!url.trim() || loading}
            className="px-4 py-2 rounded-lg bg-medical-blue/20 border border-medical-blue/40 text-medical-blue text-sm font-medium hover:bg-medical-blue/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Extract
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
