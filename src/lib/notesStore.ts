import type { StudyStatus } from '../types'

export interface NoteOverride {
  notes: string
  mistakes: string
  status: StudyStatus
}

export type NoteOverrides = Record<string, NoteOverride>

const KEY = 'cross406.notes.v1'

export function loadNoteOverrides(): NoteOverrides {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as NoteOverrides) : {}
  } catch {
    return {}
  }
}

export function saveNoteOverrides(value: NoteOverrides): void {
  localStorage.setItem(KEY, JSON.stringify(value))
}

export function clearNoteOverrides(): void {
  localStorage.removeItem(KEY)
}
