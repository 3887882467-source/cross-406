/**
 * 全局配置中心：所有可动态修改的备考参数都在这里。
 * 默认值只读，运行时以 localStorage 中的用户设置为准。
 */

export type SubjectKey = 'politics' | 'english' | 'math' | 'management'

export interface SubjectSetting {
  key: SubjectKey
  name: string
  full: number
  target: number
  current: number
}

export interface Settings {
  examDate: string
  publicLine: number
  provinceLine: number
  subjects: SubjectSetting[]
  // AI 解析接入配置
  deepSeekKey: string
  ollamaUrl: string
  ollamaModel: string
}

export const SETTINGS_KEY = 'cross406.settings.v1'

export const DEFAULT_SETTINGS: Settings = {
  examDate: '2027-04-18',
  publicLine: 406,
  provinceLine: 279,
  subjects: [
    { key: 'politics', name: '政治', full: 100, target: 80, current: 74 },
    { key: 'english', name: '英语', full: 100, target: 80, current: 58 },
    { key: 'math', name: '高等数学（二）', full: 150, target: 120, current: 82 },
    { key: 'management', name: '管理学原理', full: 150, target: 135, current: 108 },
  ],
  deepSeekKey: '',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:7b',
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const saved = JSON.parse(raw) as Partial<Settings>
    const savedSubjects = new Map((saved.subjects ?? []).map((item) => [item.key, item]))
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      subjects: DEFAULT_SETTINGS.subjects.map((item) => ({
        ...item,
        ...(savedSubjects.get(item.key) ?? {}),
      })),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/** 按各科分差自动计算今日任务权重，最小保留 5%，合计 100% */
export function calcWeights(subjects: SubjectSetting[]): Record<SubjectKey, number> {
  const gaps = subjects.map((item) => Math.max(1, item.target - item.current))
  const total = gaps.reduce((sum, gap) => sum + gap, 0)
  const raw = subjects.map((item, index) => ({
    key: item.key,
    weight: Math.max(5, Math.round((gaps[index] / total) * 100)),
  }))
  const sum = raw.reduce((acc, item) => acc + item.weight, 0)
  return raw.reduce(
    (acc, item) => ({ ...acc, [item.key]: Math.round((item.weight / sum) * 100) }),
    {} as Record<SubjectKey, number>,
  )
}
