import { useEffect, useMemo, useState } from 'react'
import MathText from '../components/MathText'
import { SectionHead } from '../components/ui'
import { useSettings } from '../config/SettingsContext'
import { exams, loadExam } from '../data/questionLoader'
import { analyzeQuestion, type AIProvider } from '../lib/ai'
import { useTasks } from '../state/TaskContext'
import type { Question } from '../types'

type Filter = 'all' | '单选' | '多选' | '简答' | 'wrong'

interface RecordItem {
  userAnswer: string
  correct: boolean
}
type Records = Record<number, RecordItem>
type AllRecords = Record<string, Records>

interface ExamResult {
  examId: string
  subject: string
  score: number
  correct: number
  total: number
  at: string
}

const RECORDS_KEY = 'cross406.practice.v2'
const RESULTS_KEY = 'cross406.examResults.v1'

function loadAllRecords(): AllRecords {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    return raw ? (JSON.parse(raw) as AllRecords) : {}
  } catch {
    return {}
  }
}

function loadResults(): ExamResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY)
    return raw ? (JSON.parse(raw) as ExamResult[]) : []
  } catch {
    return []
  }
}

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '单选', label: '单选' },
  { key: '多选', label: '多选' },
  { key: '简答', label: '简答' },
  { key: 'wrong', label: '错题' },
]

const readyExams = exams.filter((exam) => exam.status === 'ready')
const sourceExams = exams.filter((exam) => exam.status !== 'ready')

export default function Practice() {
  const { settings, updateSubject } = useSettings()
  const { markSubjectDone } = useTasks()
  const [examId, setExamId] = useState(readyExams[0]?.id ?? '')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [allRecords, setAllRecords] = useState<AllRecords>(() => loadAllRecords())
  const [results, setResults] = useState<ExamResult[]>(() => loadResults())
  const [currentId, setCurrentId] = useState(1)
  const [filter, setFilter] = useState<Filter>('all')
  const [picked, setPicked] = useState<string | null>(null)
  const [multiPicked, setMultiPicked] = useState<string[]>([])
  const [text, setText] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [selfMark, setSelfMark] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiProvider, setAiProvider] = useState<AIProvider>('ollama')
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const exam = exams.find((item) => item.id === examId) ?? readyExams[0]
  const records = allRecords[examId] ?? {}

  useEffect(() => {
    let alive = true
    setLoading(true)
    setLoadError('')
    loadExam(exam)
      .then((list) => {
        if (!alive) return
        setQuestions(list)
        setCurrentId(list[0]?.id ?? 1)
        setSubmitted(false)
      })
      .catch((error: unknown) => {
        if (alive) setLoadError(error instanceof Error ? error.message : '试卷加载失败')
      })
      .finally(() => alive && setLoading(false))
  }, [examId])

  const question = questions.find((item) => item.id === currentId) ?? questions[0]

  const visible = useMemo(
    () =>
      questions.filter((item) => {
        if (filter === 'all') return true
        if (filter === 'wrong') return Boolean(records[item.id]) && !records[item.id].correct
        return item.type === filter
      }),
    [questions, filter, records],
  )

  const goTo = (id: number) => {
    const record = records[id]
    setCurrentId(id)
    setPicked(record?.userAnswer ?? null)
    setMultiPicked(
      record && question && question.type === '多选'
        ? (question.options ?? []).filter((opt) => (record.userAnswer ?? '').includes(opt.trim().charAt(0)))
        : [],
    )
    setText(record?.userAnswer ?? '')
    setRevealed(Boolean(record))
    setSelfMark(record ? record.correct : null)
    setAiOpen(false)
    setAiText('')
    setAiError('')
  }

  useEffect(() => {
    if (visible.length > 0 && !visible.some((item) => item.id === currentId)) goTo(visible[0].id)
  }, [filter, records, questions])

  const persistRecords = (nextRecords: Records) => {
    const next = { ...allRecords, [examId]: nextRecords }
    setAllRecords(next)
    localStorage.setItem(RECORDS_KEY, JSON.stringify(next))
  }

  const saveRecord = (answer: string, correct: boolean) => {
    if (!question) return
    persistRecords({ ...records, [question.id]: { userAnswer: answer, correct } })
    setRevealed(true)
  }

  const submitChoice = () => {
    if (!question) return
    if (question.type === '多选') {
      if (multiPicked.length === 0) return
      const chosen = multiPicked.map((opt) => opt.trim().charAt(0)).sort().join('')
      const correct = chosen === question.answer.replace(/[^A-D]/g, '').split('').sort().join('')
      saveRecord(chosen, correct)
      return
    }
    if (!picked) return
    const correct = picked.trim().charAt(0) === question.answer.trim().charAt(0)
    saveRecord(picked, correct)
  }

  const markSelf = (correct: boolean) => {
    if (!text.trim() || !question) return
    setSelfMark(correct)
    saveRecord(text.trim(), correct)
  }

  const clearRecords = () => {
    if (!window.confirm('清除当前试卷的答题记录？')) return
    const next = { ...allRecords }
    delete next[examId]
    setAllRecords(next)
    localStorage.setItem(RECORDS_KEY, JSON.stringify(next))
    setPicked(null)
    setMultiPicked([])
    setText('')
    setRevealed(false)
    setSelfMark(null)
    setSubmitted(false)
  }

  const submitExam = () => {
    if (!questions.length || exam.subjectKey === 'other') return
    const answered = questions.filter((item) => records[item.id]).length
    if (answered < questions.length && !window.confirm(`还有 ${questions.length - answered} 题未作答，确定交卷？`)) return
    const correct = questions.filter((item) => records[item.id]?.correct).length
    const full = settings.subjects.find((item) => item.key === exam.subjectKey)?.full ?? 100
    const score = Math.round((correct / questions.length) * full)
    const result: ExamResult = {
      examId,
      subject: exam.subject,
      score,
      correct,
      total: questions.length,
      at: new Date().toISOString(),
    }
    const next = [...results.filter((item) => item.examId !== examId), result]
    setResults(next)
    localStorage.setItem(RESULTS_KEY, JSON.stringify(next))
    updateSubject(exam.subjectKey, { current: score })
    markSubjectDone(exam.subjectKey)
    setSubmitted(true)
  }

  const runAI = async () => {
    if (!question) return
    setAiLoading(true)
    setAiError('')
    setAiText('')
    try {
      const answer = await analyzeQuestion(aiProvider, settings, {
        subject: exam.subject,
        question: question.question,
        userAnswer: question.type === '多选' ? multiPicked.map((o) => o.trim().charAt(0)).join('') : picked ?? text,
        correctAnswer: question.answer,
        explanation: question.explanation,
      })
      setAiText(answer)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : '分析失败')
    } finally {
      setAiLoading(false)
    }
  }

  const done = Object.keys(records).length
  const correctCount = Object.values(records).filter((record) => record.correct).length
  const wrongCount = done - correctCount
  const latest = results.find((item) => item.examId === examId)
  const index = visible.findIndex((item) => item.id === currentId)
  const isLatexQuestion = question ? /\$/.test(question.question) : false
  const hasSourceImage = exam.id === 'math2-2025'
  const shortOptions = Boolean(question && question.options.length === 4 && question.options.every((item) => item.length <= 26))

  return (
    <div className="space-y-6">
      <SectionHead
        eyebrow="Practice"
        title="刷题 · 真题作战台"
        right={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-muted">
            <span>已做 <span className="num font-semibold text-ink">{done}</span>/{questions.length}</span>
            <span>答对 <span className="num font-semibold text-teal">{correctCount}</span></span>
            <span>错题 <span className="num font-semibold text-danger">{wrongCount}</span></span>
            <button type="button" onClick={clearRecords} className="font-medium text-rose underline-offset-4 hover:underline">
              清除记录
            </button>
          </div>
        }
      />

      {/* 试卷选择：按需加载 */}
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="eyebrow">当前试卷</span>
          <select
            className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-[15px] text-[#111827] outline-none focus:border-[#111827]"
            value={examId}
            onChange={(event) => setExamId(event.target.value)}
          >
            {readyExams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.year} · {item.subject} · {item.setName}
              </option>
            ))}
          </select>
          {exam && (
            <>
              <span className="chip border-teal/35 bg-teal/10 text-teal">已解析 {exam.questionCount} 题</span>
              <span className="text-[13px] text-muted">{exam.chapterTags.slice(0, 3).join(' / ')}…</span>
            </>
          )}
        </div>
        <details className="mt-4 border-t border-line pt-4">
          <summary className="cursor-pointer text-[14px] font-medium text-muted hover:text-ink">
            桌面原始题库文件（{sourceExams.length} 份，已解析的套卷见上方下拉框）
          </summary>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {sourceExams.map((item) => (
              <div key={item.id} className="rounded-lg border border-line bg-panel2/60 px-4 py-3">
                <div className="text-[14px] font-medium text-ink">{item.setName}</div>
                <div className="mt-1 text-[13px] leading-5 text-muted">
                  {item.subject} · {item.years.join('/') || '年份未标注'} · {item.format.toUpperCase()} ·{' '}
                  <span className="num">{item.status}</span>
                </div>
                <div className="num mt-1 break-all text-[12px] text-muted">{item.sourceFile}</div>
              </div>
            ))}
          </div>
        </details>
      </section>

      {submitted && latest && (
        <div className="rounded-2xl border border-teal/40 bg-teal/10 p-6">
          <div className="eyebrow text-teal">Exam Submitted</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-4">
            <span className="text-[16px] font-semibold text-ink">交卷得分</span>
            <span className="num text-4xl font-black text-teal">{latest.score}</span>
            <span className="text-[14px] text-muted">/ {settings.subjects.find((s) => s.key === exam.subjectKey)?.full ?? 100} 分</span>
          </div>
          <p className="mt-2 text-[14px] text-copy">
            答对 {latest.correct} / {latest.total} 题，成绩已同步到首页看板，今日任务已自动打勾。
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* 左侧题号与筛选 */}
        <section className="panel h-fit p-5">
          <div className="eyebrow mb-3">筛选</div>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const active = filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`chip text-[14px] transition-colors ${
                    active ? 'border-rose/40 bg-roseSoft text-rose' : 'border-line bg-panel2 text-copy hover:border-rose/30 hover:text-ink'
                  }`}
                >
                  {item.label}
                  {item.key === 'wrong' && wrongCount > 0 && <span className="num ml-1 font-semibold">{wrongCount}</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="eyebrow">题号</span>
            <span className="text-[13px] text-muted">共 {visible.length} 题</span>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {visible.map((item) => {
              const record = records[item.id]
              const state = record ? (record.correct ? 'correct' : 'wrong') : 'empty'
              const active = item.id === currentId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(item.id)}
                  className={`num flex aspect-square items-center justify-center rounded-lg border text-[14px] font-semibold transition-colors ${
                    active
                      ? 'border-rose bg-roseSoft text-rose'
                      : state === 'correct'
                        ? 'border-teal/30 bg-teal/10 text-teal'
                        : state === 'wrong'
                          ? 'border-danger/30 bg-danger/10 text-danger'
                          : 'border-line bg-panel2 text-muted hover:border-rose/30 hover:text-ink'
                  }`}
                >
                  {item.id}
                </button>
              )
            })}
            {visible.length === 0 && <div className="col-span-5 py-6 text-center text-[14px] text-muted">暂无题目</div>}
          </div>
          <div className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] text-muted">
            <div className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-teal" />答对</div>
            <div className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-danger" />答错（进错题本）</div>
            <div className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#C9CDD2]" />未做</div>
          </div>
        </section>

        {/* 右侧答题区 */}
        <div className="min-h-[560px] min-w-0">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[#D1D5DB] bg-white p-8 text-[15px] text-muted">
              正在加载试卷…
            </div>
          ) : loadError ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-danger/30 bg-white p-8 text-[15px] text-danger">
              {loadError}
            </div>
          ) : !question || visible.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-[#D1D5DB] bg-white p-8 text-center shadow-sm">
              <div className="text-lg font-semibold text-ink">这里暂时没有题</div>
              <p className="mt-2 text-[14px] text-muted">换个筛选条件看看，或者去做几道题。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 题干框 */}
              <div className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="num text-xl font-bold text-[#111827]">第 {question.id} 题</span>
                    <span className="chip border-line bg-panel2 text-[14px] text-muted">{question.type}</span>
                    <span className="text-[14px] text-muted">共 {questions.length} 题</span>
                  </div>
                  {records[question.id] && (
                    <span
                      className={`chip ${
                        records[question.id].correct
                          ? 'border-teal/35 bg-teal/10 text-teal'
                          : 'border-danger/35 bg-danger/10 text-danger'
                      }`}
                    >
                      {records[question.id].correct ? '已答对' : '错题'}
                    </span>
                  )}
                </div>
                {isLatexQuestion || !hasSourceImage ? (
                  <div className="mt-5 whitespace-pre-wrap text-[19px] leading-8 text-[#111827]">
                    <MathText text={question.question} />
                  </div>
                ) : (
                  <div className="mt-5 w-full min-w-0 overflow-x-auto">
                    <img
                      src={`${import.meta.env.BASE_URL}exam/q${question.id}.png`}
                      alt={`第 ${question.id} 题原题`}
                      className="block h-auto w-full min-w-[620px] object-left"
                    />
                  </div>
                )}
              </div>

              {/* 选项框 */}
              <div className="rounded-xl border border-[#D1D5DB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.05)] sm:p-6">
                {question.type !== '简答' ? (
                  <div className={shortOptions ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                    {question.options.map((option) => {
                      const letter = option.trim().charAt(0)
                      const correctSet = question.answer.replace(/[^A-D]/g, '').split('')
                      const isPicked = question.type === '多选' ? multiPicked.includes(option) : picked === option
                      let style = 'border-[#D1D5DB] bg-white text-[#111827] hover:border-[#111827] hover:bg-[#F9FAFB]'
                      if (isPicked) style = 'border-[#111827] bg-[#F3F4F6] font-semibold text-[#111827]'
                      if (revealed) {
                        if (correctSet.includes(letter)) style = 'border-teal bg-teal/10 font-semibold text-teal'
                        else if (isPicked) style = 'border-danger bg-danger/10 font-semibold text-danger'
                        else style = 'border-[#D1D5DB] bg-white text-[#4B5563]'
                      }
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={revealed}
                          onClick={() => {
                            if (question.type === '多选') {
                              setMultiPicked((prev) =>
                                prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
                              )
                            } else {
                              setPicked(option)
                            }
                          }}
                          className={`w-full rounded-lg border px-5 py-4 text-left text-lg leading-relaxed transition-colors sm:text-[19px] ${style}`}
                        >
                          <MathText text={option} />
                        </button>
                      )
                    })}
                    {!revealed && (
                      <button
                        type="button"
                        onClick={submitChoice}
                        disabled={question.type === '多选' ? multiPicked.length === 0 : !picked}
                        className="mt-1 rounded-lg bg-[#111827] px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        提交答案
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      className="h-36 w-full resize-y rounded-lg border border-[#D1D5DB] bg-white p-4 text-lg leading-relaxed text-[#111827] outline-none focus:border-[#111827]"
                      placeholder="在这里写下你的答案…"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                    />
                    {!revealed && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setRevealed(true)}
                          className="rounded-lg border border-[#D1D5DB] bg-white px-5 py-2.5 text-base font-medium text-[#111827] hover:border-[#111827]"
                        >
                          直接看答案
                        </button>
                        <button
                          type="button"
                          onClick={() => markSelf(false)}
                          disabled={!text.trim()}
                          className="rounded-lg bg-[#111827] px-5 py-2.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          做完 · 对答案
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 解析框 */}
              {revealed && (
                <div className="space-y-5 rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                  <div>
                    <div className="eyebrow mb-2">正确答案</div>
                    <div className="text-xl font-bold text-teal"><MathText text={question.answer} /></div>
                  </div>
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="eyebrow">解析</span>
                      <button
                        type="button"
                        onClick={() => setAiOpen((prev) => !prev)}
                        className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-1.5 text-[13px] font-semibold text-amber hover:bg-amber/20"
                      >
                        ✨ AI 深度解析
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-base leading-8 text-[#1F2937] sm:text-[17px]">
                      <MathText text={question.explanation} />
                    </p>
                  </div>

                  {aiOpen && (
                    <div className="rounded-xl border border-line bg-panel2/60 p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-[14px] text-[#111827]"
                          value={aiProvider}
                          onChange={(event) => setAiProvider(event.target.value as AIProvider)}
                        >
                          <option value="ollama">本机 Ollama（离线）</option>
                          <option value="deepseek">DeepSeek（联网）</option>
                        </select>
                        <button
                          type="button"
                          onClick={runAI}
                          disabled={aiLoading}
                          className="rounded-lg bg-[#111827] px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-40"
                        >
                          {aiLoading ? '分析中…' : '开始分析'}
                        </button>
                        <span className="text-[13px] text-muted">错因 · 知识点 · 复习建议</span>
                      </div>
                      {aiError && <p className="mt-4 text-[14px] text-danger">{aiError}</p>}
                      {aiText && (
                        <div className="mt-4 whitespace-pre-wrap text-[15px] leading-8 text-[#1F2937]">{aiText}</div>
                      )}
                    </div>
                  )}

                  {question.type === '简答' && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
                      <span className="text-[14px] text-muted">自己批改：</span>
                      <button
                        type="button"
                        onClick={() => markSelf(true)}
                        className={`rounded-lg border px-4 py-1.5 text-[14px] font-semibold ${
                          selfMark === true ? 'border-teal bg-teal/10 text-teal' : 'border-[#D1D5DB] bg-white text-[#111827] hover:border-teal/60'
                        }`}
                      >
                        我答对了
                      </button>
                      <button
                        type="button"
                        onClick={() => markSelf(false)}
                        className={`rounded-lg border px-4 py-1.5 text-[14px] font-semibold ${
                          selfMark === false ? 'border-danger bg-danger/10 text-danger' : 'border-[#D1D5DB] bg-white text-[#111827] hover:border-danger/60'
                        }`}
                      >
                        我答错了
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => index > 0 && goTo(visible[index - 1].id)}
                  disabled={index <= 0}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-5 py-2 text-[14px] font-medium text-[#111827] hover:border-[#111827] disabled:opacity-40"
                >
                  ← 上一题
                </button>
                <div className="flex items-center gap-4">
                  <span className="num text-[14px] text-muted">{index + 1} / {visible.length}</span>
                  <button
                    type="button"
                    onClick={submitExam}
                    className="rounded-lg bg-[#111827] px-5 py-2 text-[14px] font-semibold text-white hover:opacity-90"
                  >
                    交卷算分
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => index < visible.length - 1 && goTo(visible[index + 1].id)}
                  disabled={index >= visible.length - 1}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-5 py-2 text-[14px] font-medium text-[#111827] hover:border-[#111827] disabled:opacity-40"
                >
                  下一题 →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
