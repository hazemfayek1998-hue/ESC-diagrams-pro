import type { DiagramRecord, AppSettings } from './types'

const DIAGRAMS_KEY = 'esc_study_diagrams'
const SETTINGS_KEY = 'esc_study_settings'

function isBrowser() { return typeof window !== 'undefined' }

// ─── Diagrams ────────────────────────────────────────────────────────────────

export function getAllDiagrams(): DiagramRecord[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(DIAGRAMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function getDiagram(id: string): DiagramRecord | null {
  return getAllDiagrams().find(d => d.id === id) ?? null
}

export function saveDiagram(diagram: DiagramRecord): void {
  if (!isBrowser()) return
  const all = getAllDiagrams()
  const idx = all.findIndex(d => d.id === diagram.id)
  const updated = { ...diagram, updatedAt: new Date().toISOString() }
  if (idx >= 0) { all[idx] = updated } else { all.unshift(updated) }
  localStorage.setItem(DIAGRAMS_KEY, JSON.stringify(all))
}

export function deleteDiagram(id: string): void {
  if (!isBrowser()) return
  localStorage.setItem(DIAGRAMS_KEY, JSON.stringify(getAllDiagrams().filter(d => d.id !== id)))
}

export function updateDiagramStats(id: string, score: number): void {
  const d = getDiagram(id)
  if (!d) return
  saveDiagram({
    ...d,
    studyCount: d.studyCount + 1,
    lastStudiedAt: new Date().toISOString(),
    bestScore: d.bestScore == null ? score : Math.max(d.bestScore, score),
  })
}

// ─── Settings ────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  defaultHideCategories: ['medication', 'threshold'],
  showMinimap: true,
  darkMode: true,
  autoLayout: true,
}

export function getSettings(): AppSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { return DEFAULT_SETTINGS }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  if (!isBrowser()) return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), ...settings }))
}

export function getApiKey(): string { return getSettings().apiKey }

// ─── Export / Import ─────────────────────────────────────────────────────────

export function exportLibrary(): string {
  return JSON.stringify({ version: 1, diagrams: getAllDiagrams() }, null, 2)
}

export function importLibrary(json: string): { count: number; errors: string[] } {
  const errors: string[] = []
  try {
    const { diagrams = [] } = JSON.parse(json)
    if (!Array.isArray(diagrams)) throw new Error('Invalid format');
    (diagrams as DiagramRecord[]).forEach(d => {
      try { saveDiagram(d) } catch { errors.push(`Failed: ${d.title}`) }
    })
    return { count: diagrams.length - errors.length, errors }
  } catch { return { count: 0, errors: ['Invalid JSON file'] } }
}
