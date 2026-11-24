export type SchoolLevel = '公办' | '独立学院' | '民办' | '公办职业本科'
export type SchoolTag = '冲刺' | '稳妥' | '保底' | '已排除'
export type StudyStatus = '未开始' | '复习中' | '已掌握' | '薄弱'

export interface School {
  id: string
  name: string
  level: SchoolLevel
  majors: string
  plan2026: number
  plan2025: number
  tuition: number
  score2026: number
  tag: SchoolTag
}

export interface SyllabusNode {
  id: string
  title: string
  status: StudyStatus
  notes: string
  mistakes: string
  children?: SyllabusNode[]
}

export interface LineYear {
  year: number
  provinceLine: number
  publicLine: number
}

export interface Question {
  id: number
  type: '单选' | '多选' | '简答'
  question: string
  options: string[]
  answer: string
  explanation: string
}

export interface ExamMeta {
  id: string
  year: number | null
  years: number[]
  subject: string
  subjectKey: 'politics' | 'english' | 'math' | 'management' | 'other'
  setName: string
  file: string | null
  questionCount: number
  chapterTags: string[]
  status: 'ready' | 'source_only' | 'archived' | 'image'
  sourceFile: string | null
  format: string
}
