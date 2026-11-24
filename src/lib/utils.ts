import { gapThresholds } from '../data/scoreTargets'

export type GapLevel = 'danger' | 'warn' | 'good'

export function getGapLevel(gap: number): GapLevel {
  if (gap > gapThresholds.danger) return 'danger'
  if (gap >= gapThresholds.warn) return 'warn'
  return 'good'
}

export const gapText: Record<GapLevel, string> = {
  danger: '差距过大',
  warn: '需要补强',
  good: '基本达标',
}

export const gapHex: Record<GapLevel, string> = {
  danger: '#E15B64',
  warn: '#D97706',
  good: '#0F766E',
}

/** 距离目标日期还有多少天（按本地日历日计算，当天为 0） */
export function daysUntil(dateStr: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(`${dateStr}T00:00:00`)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function money(n: number): string {
  return `¥${n.toLocaleString('zh-CN')}`
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}
