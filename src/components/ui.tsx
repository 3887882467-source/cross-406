import type { ReactNode } from 'react'
import type { SchoolLevel, SchoolTag, StudyStatus } from '../types'

const tagStyles: Record<SchoolTag, string> = {
  冲刺: 'border-amber/35 bg-amber/10 text-amber',
  稳妥: 'border-teal/35 bg-teal/10 text-teal',
  保底: 'border-calm/35 bg-calm/10 text-calm',
  已排除: 'border-line bg-panel2 text-muted',
}

export function TagBadge({ tag }: { tag: SchoolTag }) {
  return <span className={`chip num whitespace-nowrap ${tagStyles[tag]}`}>{tag}</span>
}

export function LevelBadge({ level }: { level: SchoolLevel }) {
  const publicSchool = level === '公办' || level === '公办职业本科'
  return (
    <span
      className={`chip whitespace-nowrap ${
        publicSchool ? 'border-teal/30 bg-teal/5 text-teal' : 'border-line bg-panel2 text-muted'
      }`}
    >
      {level}
    </span>
  )
}

const statusStyles: Record<StudyStatus, string> = {
  已掌握: 'border-teal/35 bg-teal/10 text-teal',
  复习中: 'border-amber/35 bg-amber/10 text-amber',
  薄弱: 'border-danger/35 bg-danger/10 text-danger',
  未开始: 'border-line bg-panel2 text-muted',
}

export function StatusBadge({ status }: { status: StudyStatus }) {
  return <span className={`chip ${statusStyles[status]}`}>{status}</span>
}

export function SectionHead({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string
  title: string
  right?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="page-title mt-1">{title}</h2>
      </div>
      {right}
    </div>
  )
}
