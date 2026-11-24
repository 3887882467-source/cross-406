import { useState } from 'react'
import { SectionHead, StatusBadge } from '../components/ui'
import { syllabus } from '../data'
import {
  clearNoteOverrides,
  loadNoteOverrides,
  saveNoteOverrides,
  type NoteOverride,
  type NoteOverrides,
} from '../lib/notesStore'
import type { StudyStatus, SyllabusNode } from '../types'

const statuses: StudyStatus[] = ['未开始', '复习中', '已掌握', '薄弱']

const statusDot: Record<StudyStatus, string> = {
  已掌握: 'bg-teal',
  复习中: 'bg-amber',
  薄弱: 'bg-danger',
  未开始: 'bg-[#C9CDD2]',
}

export default function Syllabus() {
  const subjectNames = Object.keys(syllabus)
  const [subject, setSubject] = useState(subjectNames[0])
  const [activeId, setActiveId] = useState(syllabus[subjectNames[0]][0]?.id ?? '')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [overrides, setOverrides] = useState<NoteOverrides>(() => loadNoteOverrides())
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<NoteOverride>({ notes: '', mistakes: '', status: '未开始' })

  const chapters = syllabus[subject]
  const apply = (node: SyllabusNode): SyllabusNode => ({ ...node, ...(overrides[node.id] ?? {}) })

  let chapter = apply(chapters[0])
  let active = chapter
  let child: SyllabusNode | undefined
  for (const rawChapter of chapters) {
    const candidateChapter = apply(rawChapter)
    if (candidateChapter.id === activeId) {
      chapter = candidateChapter
      active = candidateChapter
      child = undefined
      break
    }
    const found = (rawChapter.children ?? []).map(apply).find((node) => node.id === activeId)
    if (found) {
      chapter = candidateChapter
      active = found
      child = found
      break
    }
  }

  const allNodes = chapters.flatMap((item) => [item, ...(item.children ?? [])]).map(apply)
  const counts = statuses.reduce(
    (acc, status) => ({ ...acc, [status]: allNodes.filter((node) => node.status === status).length }),
    {} as Record<StudyStatus, number>,
  )

  const changeSubject = (name: string) => {
    setSubject(name)
    setActiveId(syllabus[name][0]?.id ?? '')
    setExpanded({})
    setEditing(false)
  }

  const startEdit = () => {
    setDraft({ notes: active.notes, mistakes: active.mistakes, status: active.status })
    setEditing(true)
  }

  const saveEdit = () => {
    const next = { ...overrides, [active.id]: draft }
    setOverrides(next)
    saveNoteOverrides(next)
    setEditing(false)
  }

  const resetAll = () => {
    if (window.confirm('恢复为初始笔记？本机保存的修改会被清除。')) {
      clearNoteOverrides()
      setOverrides({})
      setEditing(false)
    }
  }

  const selectClass =
    'rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] text-copy outline-none focus:border-rose'

  return (
    <div className="space-y-6">
      <SectionHead
        eyebrow="Syllabus & Notes"
        title="考纲笔记"
        right={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            {statuses.map((status) => (
              <span key={status} className="flex items-center gap-2">
                <i className={`h-2.5 w-2.5 rounded-full ${statusDot[status]}`} />
                {status} <span className="num font-semibold text-ink">{counts[status]}</span>
              </span>
            ))}
            <button
              type="button"
              onClick={resetAll}
              className="ml-1 font-medium text-rose underline-offset-4 hover:underline"
            >
              恢复初始
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* 左侧考纲树 */}
        <section className="panel h-fit overflow-hidden">
          <div className="flex border-b border-line bg-panel2/60">
            {subjectNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => changeSubject(name)}
                className={`flex-1 px-2 py-4 text-[14px] font-semibold transition-colors ${
                  subject === name
                    ? 'border-b-2 border-rose bg-roseSoft text-rose'
                    : 'border-b-2 border-transparent text-muted hover:text-ink'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="space-y-1 p-3">
            {chapters.map((rawChapter, index) => {
              const node = apply(rawChapter)
              const isOpen = expanded[node.id] ?? index === 0
              return (
                <div key={node.id}>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={isOpen ? '收起' : '展开'}
                      onClick={() => setExpanded((prev) => ({ ...prev, [node.id]: !isOpen }))}
                      className="w-7 shrink-0 py-2.5 text-center text-[11px] text-muted hover:text-ink"
                    >
                      {isOpen ? '▼' : '▶'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(node.id)
                        setEditing(false)
                      }}
                      className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium transition-colors ${
                        activeId === node.id ? 'bg-roseSoft text-rose' : 'text-copy hover:bg-panel2'
                      }`}
                    >
                      <span className="truncate">{node.title}</span>
                      <i className={`h-2 w-2 shrink-0 rounded-full ${statusDot[node.status]}`} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="ml-4 border-l border-line pl-2.5">
                      {(rawChapter.children ?? []).map((rawChild) => {
                        const item = apply(rawChild)
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              setActiveId(item.id)
                              setEditing(false)
                            }}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                              activeId === item.id
                                ? 'bg-roseSoft font-semibold text-rose'
                                : 'text-muted hover:bg-panel2 hover:text-copy'
                            }`}
                          >
                            <span className="truncate">{item.title}</span>
                            <i className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[item.status]}`} />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 右侧笔记详情 */}
        <section className="panel min-h-[560px] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
            <div className="min-w-0">
              <div className="eyebrow truncate">
                {subject} / {chapter.title}
                {child ? ` / ${child.title}` : ''}
              </div>
              <h2 className="mt-2 text-2xl font-bold text-ink">{active.title}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!editing ? (
                <>
                  <StatusBadge status={active.status} />
                  <button
                    type="button"
                    onClick={startEdit}
                    className="rounded-lg border border-line bg-panel2 px-4 py-1.5 text-[13px] font-medium text-copy transition-colors hover:border-rose/40 hover:bg-roseSoft hover:text-rose"
                  >
                    编辑
                  </button>
                </>
              ) : (
                <>
                  <select
                    className={selectClass}
                    value={draft.status}
                    onChange={(event) => setDraft({ ...draft, status: event.target.value as StudyStatus })}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-line px-4 py-1.5 text-[13px] text-muted hover:text-ink"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="rounded-lg bg-teal px-4 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    保存
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="eyebrow">个人笔记</span>
                <textarea
                  className="mt-3 h-60 w-full resize-y rounded-lg border border-line bg-panel2 p-4 text-[15px] leading-8 text-copy outline-none focus:border-rose"
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="eyebrow">错题 / 易错点</span>
                <textarea
                  className="mt-3 h-36 w-full resize-y rounded-lg border border-line bg-panel2 p-4 text-[15px] leading-8 text-copy outline-none focus:border-rose"
                  value={draft.mistakes}
                  onChange={(event) => setDraft({ ...draft, mistakes: event.target.value })}
                />
              </label>
              <p className="text-[13px] text-muted">保存后写入本机浏览器，不会改动原始 data 文件。</p>
            </div>
          ) : (
            <div className="mt-7 space-y-8">
              <div>
                <div className="eyebrow mb-4">个人笔记</div>
                {active.notes ? (
                  <p className="whitespace-pre-wrap text-[15px] leading-8 text-copy">{active.notes}</p>
                ) : (
                  <p className="text-[15px] text-muted">暂无笔记，点右上角「编辑」添加。</p>
                )}
              </div>
              <div>
                <div className="eyebrow mb-4">错题 / 易错点</div>
                {active.mistakes ? (
                  <div className="rounded-xl border border-danger/25 bg-danger/5 px-5 py-4">
                    <p className="whitespace-pre-wrap text-[15px] leading-8 text-copy">{active.mistakes}</p>
                  </div>
                ) : (
                  <p className="text-[15px] text-muted">暂无错题记录。</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
