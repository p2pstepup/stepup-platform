export interface ActiveProgram {
  id: string
  name: string
  slug: string
  type: string
  role: string
}

const KEY = 'activeProgram'

export function getActiveProgram(): ActiveProgram | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setActiveProgram(program: ActiveProgram) {
  localStorage.setItem(KEY, JSON.stringify(program))
}

export function clearActiveProgram() {
  localStorage.removeItem(KEY)
}

export const PROGRAM_TYPE_LABELS: Record<string, string> = {
  step1: 'Step 1',
  step2: 'Step 2',
  nbme: 'NBME',
  osce: 'OSCE',
  research: 'Research',
}

export const PROGRAM_TYPE_COLORS: Record<string, {bg: string, text: string}> = {
  step1:    {bg: '#0d2340', text: '#c9a84c'},
  step2:    {bg: '#1a3a5c', text: '#c9a84c'},
  nbme:     {bg: '#3a1a0d', text: '#c9a84c'},
  osce:     {bg: '#0d3a1a', text: '#c9a84c'},
  research: {bg: '#2a0d3a', text: '#c9a84c'},
}
