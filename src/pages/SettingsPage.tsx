import { useEffect, useState } from 'react'
import { SectionHead } from '../components/ui'
import { useSettings } from '../config/SettingsContext'
import { calcWeights, type Settings } from '../config/settings'

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [draft, setDraft] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => setDraft(settings), [settings])

  const weights = calcWeights(draft.subjects)

  const save = () => {
    updateSettings(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const field =
    'w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-[15px] text-[#111827] outline-none focus:border-[#111827]'
  const label = 'block text-[13px] font-medium text-muted'

  return (
    <div className="space-y-6">
      <SectionHead
        eyebrow="Control Center"
        title="⚙️ 设置"
        right={
          <div className="flex items-center gap-3">
            {saved && <span className="text-[13px] font-semibold text-teal">已保存</span>}
            <button
              type="button"
              onClick={resetSettings}
              className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-[13px] font-medium text-[#111827] hover:border-[#111827]"
            >
              恢复默认
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-[#111827] px-5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            >
              保存设置
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 考试参数 */}
        <section className="panel p-6">
          <div className="eyebrow mb-5">Exam Parameters</div>
          <div className="space-y-5">
            <label className="block">
              <span className={label}>目标考试日期</span>
              <input type="date" className={`${field} mt-2`} value={draft.examDate} onChange={(e) => setDraft({ ...draft, examDate: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className={label}>公办线（总分）</span>
                <input type="number" className={`${field} num mt-2`} value={draft.publicLine} onChange={(e) => setDraft({ ...draft, publicLine: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className={label}>省控线</span>
                <input type="number" className={`${field} num mt-2`} value={draft.provinceLine} onChange={(e) => setDraft({ ...draft, provinceLine: Number(e.target.value) })} />
              </label>
            </div>
            <div className="rounded-xl border border-line bg-panel2/60 p-4 text-[13px] leading-7 text-muted">
              当前目标总分 <span className="num font-semibold text-ink">{draft.subjects.reduce((sum, s) => sum + s.target, 0)}</span>
              ，当前基准合计 <span className="num font-semibold text-ink">{draft.subjects.reduce((sum, s) => sum + s.current, 0)}</span>
              ，距公办线还差{' '}
              <span className="num font-semibold text-amber">
                {Math.max(0, draft.publicLine - draft.subjects.reduce((sum, s) => sum + s.current, 0))}
              </span>{' '}
              分。
            </div>
          </div>
        </section>

        {/* 四科分数 */}
        <section className="panel p-6">
          <div className="eyebrow mb-5">Subjects</div>
          <div className="space-y-3">
            {draft.subjects.map((subject) => (
              <div key={subject.key} className="rounded-xl border border-line bg-panel2/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-ink">{subject.name}</span>
                  <span className="num text-[12px] text-muted">
                    满分 {subject.full} · 任务权重 {weights[subject.key]}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[12px] text-muted">目标分</span>
                    <input
                      type="number"
                      className={`${field} num mt-1`}
                      value={subject.target}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          subjects: draft.subjects.map((item) =>
                            item.key === subject.key ? { ...item, target: Number(e.target.value) } : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12px] text-muted">当前分</span>
                    <input
                      type="number"
                      className={`${field} num mt-1`}
                      value={subject.current}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          subjects: draft.subjects.map((item) =>
                            item.key === subject.key ? { ...item, current: Number(e.target.value) } : item,
                          ),
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-6 text-muted">任务权重由各科分差自动计算，差距越大分到的任务权重越高。</p>
        </section>

        {/* AI 接入 */}
        <section className="panel p-6 lg:col-span-2">
          <div className="eyebrow mb-5">AI Deep Analysis</div>
          <div className="grid gap-5 md:grid-cols-3">
            <label className="block">
              <span className={label}>DeepSeek API Key</span>
              <input
                type="password"
                className={`${field} mt-2`}
                placeholder="sk-..."
                value={draft.deepSeekKey}
                onChange={(e) => setDraft({ ...draft, deepSeekKey: e.target.value })}
              />
              <span className="mt-2 block text-[12px] leading-5 text-muted">留空则只使用本机 Ollama。</span>
            </label>
            <label className="block">
              <span className={label}>Ollama 地址</span>
              <input
                className={`${field} mt-2`}
                value={draft.ollamaUrl}
                onChange={(e) => setDraft({ ...draft, ollamaUrl: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={label}>Ollama 模型</span>
              <input
                className={`${field} mt-2`}
                value={draft.ollamaModel}
                onChange={(e) => setDraft({ ...draft, ollamaModel: e.target.value })}
              />
            </label>
          </div>
          <p className="mt-4 text-[12px] leading-6 text-muted">
            密钥只保存在本机浏览器，不会上传。错题解析页可一键调用本地模型或 DeepSeek 分析错因。
          </p>
        </section>
      </div>
    </div>
  )
}
