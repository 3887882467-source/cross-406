import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
  type SubjectKey,
} from './settings'

interface SettingsContextValue {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  updateSubject: (key: SubjectKey, patch: Partial<Settings['subjects'][number]>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const updateSubject = useCallback((key: SubjectKey, patch: Partial<Settings['subjects'][number]>) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        subjects: prev.subjects.map((item) => (item.key === key ? { ...item, ...patch } : item)),
      }
      saveSettings(next)
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    const reset = { ...DEFAULT_SETTINGS, subjects: DEFAULT_SETTINGS.subjects.map((item) => ({ ...item })) }
    setSettings(reset)
    saveSettings(reset)
  }, [])

  const value = useMemo(
    () => ({ settings, updateSettings, updateSubject, resetSettings }),
    [settings, updateSettings, updateSubject, resetSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings 必须在 SettingsProvider 内使用')
  return context
}
