import { useMemo, useState } from 'react'
import { LevelBadge, SectionHead, TagBadge } from '../components/ui'
import { schools } from '../data'
import { useSettings } from '../config/SettingsContext'
import { money, signed } from '../lib/utils'
import type { SchoolLevel, SchoolTag } from '../types'

const levels: SchoolLevel[] = ['公办', '独立学院', '民办', '公办职业本科']
const tags: SchoolTag[] = ['冲刺', '稳妥', '保底', '已排除']

type SortKey = 'score-desc' | 'score-asc' | 'plan-desc' | 'plan-asc'

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export default function Schools() {
  const { settings } = useSettings()
  const [selectedLevels, setSelectedLevels] = useState<SchoolLevel[]>([])
  const [tuitionMax, setTuitionMax] = useState<number | null>(null)
  const [scoreMin, setScoreMin] = useState('')
  const [scoreMax, setScoreMax] = useState('')
  const [selectedTags, setSelectedTags] = useState<SchoolTag[]>([])
  const [sort, setSort] = useState<SortKey>('score-desc')

  const filtered = useMemo(() => {
    const min = scoreMin.trim() === '' ? -Infinity : Number(scoreMin)
    const max = scoreMax.trim() === '' ? Infinity : Number(scoreMax)
    const list = schools.filter(
      (school) =>
        (selectedLevels.length === 0 || selectedLevels.includes(school.level)) &&
        (tuitionMax === null || school.tuition <= tuitionMax) &&
        school.score2026 >= min &&
        school.score2026 <= max &&
        (selectedTags.length === 0 || selectedTags.includes(school.tag)),
    )
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'score-asc':
          return a.score2026 - b.score2026
        case 'plan-desc':
          return b.plan2026 - a.plan2026 || b.score2026 - a.score2026
        case 'plan-asc':
          return a.plan2026 - b.plan2026 || b.score2026 - a.score2026
        default:
          return b.score2026 - a.score2026
      }
    })
  }, [selectedLevels, tuitionMax, scoreMin, scoreMax, selectedTags, sort])

  const totalPlan = filtered.reduce((sum, school) => sum + school.plan2026, 0)
  const publicCount = filtered.filter(
    (school) => school.level === '公办' || school.level === '公办职业本科',
  ).length

  const resetFilters = () => {
    setSelectedLevels([])
    setTuitionMax(null)
    setScoreMin('')
    setScoreMax('')
    setSelectedTags([])
    setSort('score-desc')
  }

  const selectClass =
    'rounded-lg border border-line bg-white px-3 py-2 text-[15px] text-copy outline-none transition-colors focus:border-rose'

  return (
    <div className="space-y-6">
      <SectionHead
        eyebrow="School Database"
        title="院校库"
        right={
          <div className="text-[13px] text-muted">
            管理学1联考 · 共 <span className="num font-semibold text-ink">{schools.length}</span> 所招生院校
          </div>
        }
      />

      {/* 筛选区 */}
      <section className="panel space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-5">
          <div>
            <div className="eyebrow mb-3">层次</div>
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => {
                const active = selectedLevels.includes(level)
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedLevels((prev) => toggle(prev, level))}
                    className={`chip text-[13px] transition-colors ${
                      active
                        ? 'border-rose/40 bg-roseSoft text-rose'
                        : 'border-line bg-panel2 text-copy hover:border-rose/30 hover:text-ink'
                    }`}
                  >
                    {level}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-3">个人标签</div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTags((prev) => toggle(prev, tag))}
                    className={`chip text-[13px] transition-colors ${
                      active
                        ? 'border-rose/40 bg-roseSoft text-rose'
                        : 'border-line bg-panel2 text-copy hover:border-rose/30 hover:text-ink'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-5 border-t border-line pt-5">
          <label className="flex items-center gap-2.5 text-[13px] text-muted">
            学费上限
            <select
              className={selectClass}
              value={tuitionMax ?? ''}
              onChange={(event) => setTuitionMax(event.target.value === '' ? null : Number(event.target.value))}
            >
              <option value="">不限</option>
              <option value="6000">≤ ¥6,000</option>
              <option value="10000">≤ ¥10,000</option>
              <option value="20000">≤ ¥20,000</option>
            </select>
          </label>

          <label className="flex flex-wrap items-center gap-2.5 text-[13px] text-muted">
            投档分区间
            <input
              type="number"
              className={`${selectClass} w-20`}
              placeholder="最低"
              value={scoreMin}
              onChange={(event) => setScoreMin(event.target.value)}
            />
            <span>—</span>
            <input
              type="number"
              className={`${selectClass} w-20`}
              placeholder="最高"
              value={scoreMax}
              onChange={(event) => setScoreMax(event.target.value)}
            />
          </label>

          <label className="flex items-center gap-2.5 text-[13px] text-muted">
            排序
            <select className={selectClass} value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="score-desc">投档分 高→低</option>
              <option value="score-asc">投档分 低→高</option>
              <option value="plan-desc">计划数 多→少</option>
              <option value="plan-asc">计划数 少→多</option>
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-line bg-panel2 px-4 py-2 text-[13px] font-medium text-copy transition-colors hover:border-rose/30 hover:text-ink"
          >
            重置筛选
          </button>
        </div>
      </section>

      {/* 结果概览 */}
      <div className="flex flex-wrap items-center gap-x-7 gap-y-1 text-[13px] text-muted">
        <span>
          显示 <span className="num font-semibold text-teal">{filtered.length}</span> / {schools.length} 所
        </span>
        <span>
          其中公办 <span className="num font-semibold text-ink">{publicCount}</span> 所
        </span>
        <span>
          计划合计 <span className="num font-semibold text-ink">{totalPlan}</span> 人
        </span>
      </div>

      {/* 表格 */}
      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[15px]">
            <thead className="bg-panel2 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">院校</th>
                <th className="whitespace-nowrap px-4 py-4 font-semibold">层次</th>
                <th className="whitespace-nowrap px-4 py-4 font-semibold">招生专业</th>
                <th className="whitespace-nowrap px-4 py-4 text-right font-semibold">2026 计划</th>
                <th className="whitespace-nowrap px-4 py-4 text-right font-semibold">学费</th>
                <th className="whitespace-nowrap px-4 py-4 text-right font-semibold">2026 投档最低分</th>
                <th className="whitespace-nowrap px-6 py-4 font-semibold">个人标签</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-copy">
              {filtered.map((school) => {
                const delta = school.plan2026 - school.plan2025
                const aboveLine = school.score2026 >= settings.publicLine
                return (
                  <tr key={school.id} className="transition-colors hover:bg-panel2/70">
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-ink">{school.name}</td>
                    <td className="px-4 py-4">
                      <LevelBadge level={school.level} />
                    </td>
                    <td className="px-4 py-4 text-[13px] text-muted">{school.majors}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <span className="num font-semibold text-ink">{school.plan2026}</span>
                      <span className={`num ml-2 text-xs font-semibold ${delta > 0 ? 'text-teal' : delta < 0 ? 'text-danger' : 'text-muted'}`}>
                        {signed(delta)}
                      </span>
                    </td>
                    <td className="num whitespace-nowrap px-4 py-4 text-right">{money(school.tuition)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <span className={`num text-lg font-bold ${aboveLine ? 'text-amber' : 'text-ink'}`}>
                        {school.score2026}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <TagBadge tag={school.tag} />
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[15px] text-muted">
                    没有符合条件的院校，试试放宽筛选。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
