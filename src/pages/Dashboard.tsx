import { Link } from 'react-router-dom'
import { SectionHead } from '../components/ui'
import { useSettings } from '../config/SettingsContext'
import { schools } from '../data'
import { useTasks } from '../state/TaskContext'
import { daysUntil, gapHex, gapText, getGapLevel, money } from '../lib/utils'

function Stat({
  label,
  value,
  suffix,
  color,
}: {
  label: string
  value: number
  suffix?: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-4 shadow-sm">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="num mt-1 text-3xl font-bold leading-tight" style={{ color }}>
        {value}
        {suffix && <span className="ml-1.5 text-xs font-medium">{suffix}</span>}
      </div>
    </div>
  )
}

function Tick({
  pct,
  label,
  color,
  below,
}: {
  pct: number
  label: string
  color: string
  below?: boolean
}) {
  return (
    <div className="absolute top-0 h-20" style={{ left: `${pct}%` }}>
      <span
        className={`num absolute left-0 -translate-x-1/2 whitespace-nowrap text-xs font-semibold ${
          below ? 'top-[52px]' : 'top-[-4px]'
        }`}
        style={{ color }}
      >
        {label}
      </span>
      <span className="absolute top-3 h-12 w-px rounded-full" style={{ background: color, opacity: 0.65 }} />
    </div>
  )
}

function TodayTasks() {
  const { tasks, done, completed, toggleTask, markSubjectDone, resetToday } = useTasks()
  const goalHref = (subject: string) => (subject === 'management' ? '/syllabus' : '/practice')

  return (
    <section className="panel p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Today's Todo</div>
          <h2 className="page-title mt-1">📅 今日任务清单</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="num text-[13px] font-semibold text-teal">
            {completed} / {tasks.length} 已完成
          </span>
          <button
            type="button"
            onClick={resetToday}
            className="rounded-lg border border-line bg-panel2 px-3 py-1 text-[12px] text-muted hover:text-ink"
          >
            重置
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {tasks.map((task, index) => {
          const isDone = Boolean(done[task.id])
          return (
            <div
              key={task.id}
              className={`flex flex-wrap items-start gap-4 rounded-xl border p-4 transition-colors ${
                isDone ? 'border-teal/30 bg-teal/5' : 'border-line bg-panel2/50'
              }`}
            >
              <button
                type="button"
                aria-label={isDone ? '取消完成' : '标记完成'}
                onClick={() => toggleTask(task.id)}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[13px] font-bold ${
                  isDone ? 'border-teal bg-teal text-white' : 'border-[#C9CDD2] bg-white text-transparent hover:border-teal'
                }`}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-[13px] text-muted">0{index + 1}</span>
                  <span className={`text-[15px] font-semibold ${isDone ? 'text-muted line-through' : 'text-ink'}`}>
                    {task.subjectName}：{task.title}
                  </span>
                  <span className="chip border-amber/35 bg-amber/10 text-amber">权重 {task.weight}%</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{task.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {task.subject === 'english' && (
                  <button
                    type="button"
                    onClick={() => markSubjectDone('english')}
                    className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-copy hover:border-teal/50 hover:text-teal"
                  >
                    背词打卡
                  </button>
                )}
                <Link
                  to={goalHref(task.subject)}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-copy hover:border-[#111827] hover:text-ink"
                >
                  去执行 →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-[12px] leading-6 text-muted">
        任务由各科分差自动排权：差距越大，权重越高。在刷题页完成一套试卷后，对应科目任务会自动打勾。
      </p>
    </section>
  )
}

const tiers = [
  { tag: '冲刺' as const, label: '冲刺', color: '#D97706' },
  { tag: '稳妥' as const, label: '稳妥', color: '#0F766E' },
  { tag: '保底' as const, label: '保底', color: '#5B8DB8' },
]

export default function Dashboard() {
  const { settings } = useSettings()
  const { subjects, examDate, publicLine, provinceLine } = settings
  const totalFull = subjects.reduce((sum, subject) => sum + subject.full, 0)
  const days = daysUntil(examDate)
  const currentTotal = subjects.reduce((sum, subject) => sum + subject.current, 0)
  const targetTotal = subjects.reduce((sum, subject) => sum + subject.target, 0)
  const lineGap = publicLine - currentTotal
  const examYear = examDate.slice(0, 4)

  return (
    <div className="space-y-9">
      {/* 主视觉 Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-cream p-7 shadow-sm sm:p-9">
        <span className="absolute inset-y-8 left-0 w-1.5 rounded-full bg-coral" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <div className="eyebrow">Countdown / 距离考试</div>
            <h1 className="mt-2 text-xl font-bold text-[#1C1C1C] sm:text-2xl">距离 {examYear} 考试还有</h1>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="num text-[72px] font-black leading-none tracking-tight text-coral sm:text-[92px]">
                {days}
              </span>
              <span className="text-xl font-semibold text-[#1C1C1C]">天</span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px] text-[#666666]">
              <span>
                目标考试日 <span className="num font-semibold text-[#1C1C1C]">{examDate}</span>
              </span>
              <span>
                满分 <span className="num font-semibold text-[#1C1C1C]">{totalFull}</span>
              </span>
              <span>
                省控线 <span className="num font-semibold text-[#1C1C1C]">{provinceLine}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Stat label="当前总分" value={currentTotal} color="#0F766E" />
            <Stat label="目标总分" value={targetTotal} color="#D97706" />
            <Stat label="公办参考线" value={publicLine} color="#D97706" />
            <Stat
              label="距公办线"
              value={Math.abs(lineGap)}
              suffix={lineGap > 0 ? '分缺口' : '分超出'}
              color={lineGap > 0 ? '#E15B64' : '#0F766E'}
            />
          </div>
        </div>
      </section>

      <TodayTasks />

      {/* 四科差距 */}
      <section>
        <SectionHead
          eyebrow="Subject Gaps"
          title="四科差距"
          right={
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted">
              <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-danger" />&gt;30 分</span>
              <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber" />10–30 分</span>
              <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-teal" />&lt;10 分</span>
            </div>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {subjects.map((subject, index) => {
            const gap = subject.target - subject.current
            const level = getGapLevel(gap)
            const pct = Math.max(0, Math.min(100, Math.round((subject.current / subject.target) * 100)))
            return (
              <div className="panel p-6" key={subject.key}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="num text-xs text-muted">0{index + 1}</span>
                    <span className="text-[15px] font-semibold text-ink">{subject.name}</span>
                  </div>
                  <span
                    className="chip whitespace-nowrap"
                    style={{
                      color: gapHex[level],
                      borderColor: `${gapHex[level]}55`,
                      background: `${gapHex[level]}12`,
                    }}
                  >
                    {gapText[level]}
                  </span>
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <span className="num text-4xl font-bold leading-none text-ink">{subject.current}</span>
                  <span className="num pb-1 text-[13px] text-muted">
                    / 目标 {subject.target} · 满分 {subject.full}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-[13px]">
                  <span className="text-muted">距目标</span>
                  <span className="num font-semibold" style={{ color: gapHex[level] }}>
                    {gap > 0 ? `差 ${gap} 分` : '已达成'}
                  </span>
                </div>
                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-panel2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: gapHex[level] }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 总分对标 */}
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Total vs Line</div>
            <h2 className="page-title mt-1">总分对标</h2>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-muted">当前 {currentTotal} / 公办线 {publicLine}</div>
            <div className="num mt-1 text-3xl font-bold" style={{ color: lineGap > 0 ? '#D97706' : '#0F766E' }}>
              {lineGap > 0 ? `还差 ${lineGap} 分` : `已超 ${-lineGap} 分`}
            </div>
          </div>
        </div>

        <div className="relative mt-12 h-20 px-1">
          <div className="absolute inset-x-1 top-7 h-3.5 rounded-full bg-panel2" />
          <div
            className="absolute left-1 top-7 h-3.5 rounded-full bg-teal transition-all duration-500"
            style={{ width: `calc((100% - 0.5rem) * ${Math.min(1, currentTotal / totalFull)})` }}
          />
          <Tick pct={(publicLine / totalFull) * 100} label={`公办线 ${publicLine}`} color="#D97706" />
          <Tick pct={(targetTotal / totalFull) * 100} label={`目标 ${targetTotal}`} color="#5B8DB8" below />
        </div>
        <div className="flex justify-between px-1 text-xs text-muted">
          <span className="num">0</span>
          <span className="num">{totalFull}</span>
        </div>
      </section>

      {/* 目标院校三档 */}
      <section>
        <SectionHead
          eyebrow="Target Schools"
          title="目标院校三档"
          right={
            <Link to="/schools" className="rounded-lg bg-roseSoft px-3 py-1.5 text-[13px] font-semibold text-rose transition-colors hover:bg-[#FFE4E9]">
              进入院校库 →
            </Link>
          }
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => {
            const list = schools.filter((school) => school.tag === tier.tag)
            return (
              <div className="panel overflow-hidden" key={tier.tag}>
                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: tier.color }} />
                    <span className="text-base font-semibold text-ink">{tier.label}</span>
                  </div>
                  <span className="num text-[13px] text-muted">{list.length} 所</span>
                </div>
                <div className="divide-y divide-line">
                  {list.length === 0 && <div className="px-6 py-10 text-center text-[13px] text-muted">暂无标记院校</div>}
                  {list.map((school) => (
                    <div key={school.id} className="flex items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-panel2/70">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-ink">{school.name}</div>
                        <div className="mt-1 flex items-center gap-2 text-[13px] text-muted">
                          <span className="whitespace-nowrap">{school.level}</span>
                          <span>·</span>
                          <span className="num whitespace-nowrap">{money(school.tuition)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="num text-xl font-bold leading-none text-ink">{school.score2026}</div>
                        <div className="mt-1.5 text-[11px] text-muted">2026 投档</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
