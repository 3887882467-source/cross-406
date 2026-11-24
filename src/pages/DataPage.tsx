import { LevelBadge, SectionHead } from '../components/ui'
import { lineHistory, schools } from '../data'
import { useSettings } from '../config/SettingsContext'
import { signed } from '../lib/utils'

function LineBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-[13px] text-muted">{label}</span>
      <div className="h-3 flex-1 rounded-full bg-panel2">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="num w-10 shrink-0 text-right text-[15px] font-semibold text-ink">{value}</span>
    </div>
  )
}

function DivergingBar({ value, max }: { value: number; max: number }) {
  const width = Math.min(50, (Math.abs(value) / max) * 50)
  return (
    <div className="relative h-3 w-full min-w-[150px] rounded-full bg-panel2">
      <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
      <span
        className={`absolute top-0 h-full rounded-full ${value >= 0 ? 'bg-teal' : 'bg-danger'}`}
        style={value >= 0 ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }}
      />
    </div>
  )
}

const sum = (list: typeof schools, key: 'plan2025' | 'plan2026') =>
  list.reduce((total, school) => total + school[key], 0)

export default function DataPage() {
  const { settings } = useSettings()
  const [y2025, y2026] = lineHistory
  const deltaProvince = y2026.provinceLine - y2025.provinceLine
  const deltaPublic = y2026.publicLine - y2025.publicLine
  const gap2025 = y2025.publicLine - y2025.provinceLine
  const gap2026 = y2026.publicLine - y2026.provinceLine

  const publicSchools = schools.filter((school) => school.level === '公办')
  const vocationalSchools = schools.filter((school) => school.level === '公办职业本科')
  const publicOld = sum(publicSchools, 'plan2025')
  const publicNew = sum(publicSchools, 'plan2026')
  const vocOld = sum(vocationalSchools, 'plan2025')
  const vocNew = sum(vocationalSchools, 'plan2026')

  const maxDelta = Math.max(...schools.map((school) => Math.abs(school.plan2026 - school.plan2025)), 1)
  const sorted = [...schools].sort(
    (a, b) => b.plan2026 - b.plan2025 - (a.plan2026 - a.plan2025) || b.score2026 - a.score2026,
  )

  return (
    <div className="space-y-6">
      <SectionHead
        eyebrow="Year over Year"
        title="纵向对比 · 2025 vs 2026"
        right={
          <span className="chip border-line bg-panel2 text-muted">仅呈现已录入数据 · 不做预测</span>
        }
      />

      {/* 分数线对比 */}
      <section className="panel p-6 sm:p-8">
        <div className="eyebrow">Score Lines</div>
        <h2 className="page-title mt-1">省控线与公办线</h2>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead className="bg-panel2 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5 font-semibold">年份</th>
                <th className="px-4 py-3.5 text-right font-semibold">省控线</th>
                <th className="px-4 py-3.5 text-right font-semibold">公办线</th>
                <th className="px-4 py-3.5 text-right font-semibold">分差（公办 − 省控）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-copy">
              {lineHistory.map((item) => {
                const gap = item.publicLine - item.provinceLine
                return (
                  <tr key={item.year}>
                    <td className="num px-4 py-4 font-semibold text-ink">{item.year}</td>
                    <td className="num px-4 py-4 text-right">{item.provinceLine}</td>
                    <td className="num px-4 py-4 text-right font-bold text-amber">{item.publicLine}</td>
                    <td className="num px-4 py-4 text-right font-semibold text-teal">{gap}</td>
                  </tr>
                )
              })}
              <tr className="bg-panel2/60">
                <td className="px-4 py-4 text-[13px] text-muted">变化</td>
                <td className={`num px-4 py-4 text-right text-[13px] font-semibold ${deltaProvince > 0 ? 'text-danger' : 'text-teal'}`}>
                  {signed(deltaProvince)}
                </td>
                <td className={`num px-4 py-4 text-right text-[13px] font-semibold ${deltaPublic > 0 ? 'text-danger' : 'text-teal'}`}>
                  {signed(deltaPublic)}
                </td>
                <td
                  className={`num px-4 py-4 text-right text-[13px] font-semibold ${
                    gap2026 - gap2025 >= 0 ? 'text-teal' : 'text-muted'
                  }`}
                >
                  {signed(gap2026 - gap2025)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {lineHistory.map((item) => (
            <div key={item.year} className="rounded-2xl border border-line bg-panel2/50 p-6">
              <div className="mb-5 flex items-baseline justify-between">
                <span className="num text-lg font-bold text-ink">{item.year}</span>
                <span className="text-[13px] text-muted">
                  分差 <span className="num font-semibold text-teal">{item.publicLine - item.provinceLine}</span>
                </span>
              </div>
              <div className="space-y-4">
                <LineBar label="省控线" value={item.provinceLine} max={settings.subjects.reduce((sum, item) => sum + item.full, 0)} color="#0F766E" />
                <LineBar label="公办线" value={item.publicLine} max={settings.subjects.reduce((sum, item) => sum + item.full, 0)} color="#D97706" />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[13px] leading-7 text-muted">
          公办线由 <span className="num font-semibold text-copy">{y2025.publicLine}</span> 升至{' '}
          <span className="num font-bold text-amber">{y2026.publicLine}</span>（{signed(deltaPublic)}），省控线由{' '}
          <span className="num font-semibold text-copy">{y2025.provinceLine}</span> 升至{' '}
          <span className="num font-semibold text-copy">{y2026.provinceLine}</span>（{signed(deltaProvince)}）；两者分差由{' '}
          <span className="num font-semibold text-copy">{gap2025}</span> 变为{' '}
          <span className="num font-semibold text-copy">{gap2026}</span>。
        </p>
      </section>

      {/* 公办名额变化 */}
      <section className="panel p-6 sm:p-8">
        <div className="eyebrow">Public Quota</div>
        <h2 className="page-title mt-1">公办名额变化</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: '公办本科', old: publicOld, next: publicNew, count: publicSchools.length },
            { label: '公办职业本科', old: vocOld, next: vocNew, count: vocationalSchools.length },
            { label: '合计', old: publicOld + vocOld, next: publicNew + vocNew, count: publicSchools.length + vocationalSchools.length },
          ].map((item) => {
            const delta = item.next - item.old
            return (
              <div key={item.label} className="rounded-2xl border border-line bg-panel2/50 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted">{item.label}</span>
                  <span className="num text-xs text-muted">{item.count} 所</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="num text-2xl text-muted">{item.old}</span>
                  <span className="text-muted">→</span>
                  <span className="num text-3xl font-bold text-ink">{item.next}</span>
                </div>
                <div className={`num mt-2 text-[13px] font-semibold ${delta > 0 ? 'text-teal' : delta < 0 ? 'text-danger' : 'text-muted'}`}>
                  {signed(delta)} 人
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 院校计划增减 */}
      <section className="panel overflow-hidden">
        <div className="p-6 pb-5 sm:px-8">
          <div className="eyebrow">Plan by School</div>
          <h2 className="page-title mt-1">各院校招生计划增减</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-[15px]">
            <thead className="bg-panel2 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="whitespace-nowrap px-6 py-3.5 font-semibold">院校</th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold">层次</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">2025</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">2026</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">增减</th>
                <th className="whitespace-nowrap px-6 py-3.5 font-semibold">变化幅度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-copy">
              {sorted.map((school) => {
                const delta = school.plan2026 - school.plan2025
                return (
                  <tr key={school.id} className="transition-colors hover:bg-panel2/70">
                    <td className="whitespace-nowrap px-6 py-3.5 font-semibold text-ink">{school.name}</td>
                    <td className="px-4 py-3.5">
                      <LevelBadge level={school.level} />
                    </td>
                    <td className="num px-4 py-3.5 text-right text-muted">{school.plan2025}</td>
                    <td className="num px-4 py-3.5 text-right font-semibold text-ink">{school.plan2026}</td>
                    <td
                      className={`num whitespace-nowrap px-4 py-3.5 text-right font-bold ${
                        delta > 0 ? 'text-teal' : delta < 0 ? 'text-danger' : 'text-muted'
                      }`}
                    >
                      {signed(delta)}
                    </td>
                    <td className="px-6 py-3.5">
                      <DivergingBar value={delta} max={maxDelta} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
