import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useSettings } from '../config/SettingsContext'
import { calcWeights, type SubjectKey } from '../config/settings'

const TASK_KEY = 'cross406.tasks.v1'

export interface TodoTask {
  id: string
  subject: SubjectKey
  subjectName: string
  weight: number
  title: string
  detail: string
}

const actionPool: Record<SubjectKey, { title: string; detail: string }[]> = {
  math: [
    { title: '完成 2022 年真题选择题 10 道', detail: '限时 25 分钟，做完立刻对答案，错题写进错题本' },
    { title: '重做昨日高数错题 5 道', detail: '不看解析，卡住超过 3 分钟再翻答案' },
    { title: '完成极限与导数专题 12 道', detail: '重点练洛必达与复合函数求导' },
  ],
  management: [
    { title: '背诵第三章简答题 5 题', detail: '决策 / 计划 / 组织，按框架默写关键词' },
    { title: '默写管理学四章框架', detail: '只写大标题和一级要点，查漏补缺' },
    { title: '完成管理学简答 3 题', detail: '对照考纲笔记自评，标出不会的点' },
  ],
  english: [
    { title: '复习昨日错题 10 道', detail: '把错因归到词汇 / 语法 / 阅读三类' },
    { title: '背核心词汇 30 个', detail: '遮住中文回忆，不会的抄一遍' },
    { title: '完成阅读 2 篇', detail: '限时 20 分钟，订正时标出生词' },
  ],
  politics: [
    { title: '梳理本章知识框架', detail: '用考纲笔记的章节树，画一张导图' },
    { title: '完成政治选择题 15 道', detail: '错题标注对应考点，别只记住答案' },
    { title: '背诵高频考点 5 条', detail: '出声背，晚上再复述一遍' },
  ],
}

function todayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function loadDone(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(TASK_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

interface TaskContextValue {
  tasks: TodoTask[]
  done: Record<string, boolean>
  completed: number
  toggleTask: (id: string) => void
  markSubjectDone: (subject: SubjectKey) => void
  resetToday: () => void
}

const TaskContext = createContext<TaskContextValue | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [done, setDone] = useState<Record<string, boolean>>(() => loadDone())
  const date = todayKey()

  const tasks = useMemo<TodoTask[]>(() => {
    const weights = calcWeights(settings.subjects)
    const dayIndex = Math.floor(new Date(`${date}T00:00:00`).getTime() / 86_400_000)
    return [...settings.subjects]
      .sort((a, b) => b.target - b.current - (a.target - a.current))
      .map((subject, index) => {
        const pool = actionPool[subject.key]
        const action = pool[(dayIndex + index) % pool.length]
        return {
          id: `${date}-${subject.key}`,
          subject: subject.key,
          subjectName: subject.name,
          weight: weights[subject.key],
          title: action.title,
          detail: action.detail,
        }
      })
  }, [settings.subjects, date])

  const persist = useCallback((next: Record<string, boolean>) => {
    setDone(next)
    localStorage.setItem(TASK_KEY, JSON.stringify(next))
  }, [])

  const toggleTask = useCallback(
    (id: string) => persist({ ...done, [id]: !done[id] }),
    [done, persist],
  )

  const markSubjectDone = useCallback(
    (subject: SubjectKey) => {
      persist({ ...done, [`${date}-${subject}`]: true })
    },
    [done, date, persist],
  )

  const resetToday = useCallback(() => {
    const next = { ...done }
    tasks.forEach((task) => delete next[task.id])
    persist(next)
  }, [done, tasks, persist])

  const completed = tasks.filter((task) => done[task.id]).length

  const value = useMemo(
    () => ({ tasks, done, completed, toggleTask, markSubjectDone, resetToday }),
    [tasks, done, completed, toggleTask, markSubjectDone, resetToday],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks(): TaskContextValue {
  const context = useContext(TaskContext)
  if (!context) throw new Error('useTasks 必须在 TaskProvider 内使用')
  return context
}
