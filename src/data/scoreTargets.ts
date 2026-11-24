/**
 * 备考核心配置 —— 想改分数 / 倒计时 / 分数线，只改这个文件即可。
 * 页面会自动重新计算差距和缺口，不需要动组件代码。
 */

export const examConfig = {
  // 目标考试日（占位日期，确认后直接改这一行，格式 YYYY-MM-DD）
  examDate: '2027-06-05',
  // 2026 公办参考线
  publicLine: 406,
  // 2026 省控线
  provinceLine: 279,
  // 四科满分合计
  totalFull: 500,
}

export type SubjectKey = 'politics' | 'english' | 'math' | 'management'

export interface SubjectScore {
  key: SubjectKey
  name: string
  full: number
  target: number // 目标分
  current: number // 当前分（模拟成绩，按实际修改）
}

export const subjects: SubjectScore[] = [
  { key: 'politics', name: '政治', full: 100, target: 80, current: 74 },
  { key: 'english', name: '英语', full: 100, target: 80, current: 58 },
  { key: 'math', name: '高等数学（二）', full: 150, target: 120, current: 82 },
  { key: 'management', name: '管理学原理', full: 150, target: 135, current: 108 },
]

/** 差距分色阈值：>30 红，10~30 琥珀，<10 青绿 */
export const gapThresholds = {
  danger: 30,
  warn: 10,
}

export const SUBJECT_FULL: Record<SubjectKey, number> = {
  politics: 100,
  english: 100,
  math: 150,
  management: 150,
}
