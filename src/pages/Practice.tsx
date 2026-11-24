import { useEffect, useMemo, useState } from 'react'
import MathText from '../components/MathText'
import { SectionHead } from '../components/ui'
import { useSettings } from '../config/SettingsContext'
import { exams, loadExam } from '../data/questionLoader'
import { analyzeQuestion, type AIProvider } from '../lib/ai'
import { useTasks } from '../state/TaskContext'
import type { Question } from '../types'

type Filter = 'all' | '单选' | '多选' | '简答' | 'wrong'
type SubjectFilter = 'all' | 'politics' | 'english' | 'math' | 'management'

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

const subjects: { key: SubjectFilter; label: string; color: string }[] = [
  { key: 'all', label: '全部科目', color: '#111827' },
  { key: 'politics', label: '📜 政治', color: '#D97706' },
  { key: 'english', label: '🔤 英语', color: '#0F766E' },
  { key: 'math', label: '📐 高数二', color: '#5B8DB8' },
  { key: 'management', label: '📊 管理学', color: '#E15B64' },
]

const readyExams = exams.filter((exam) => exam.status === 'ready')

export default function Practice() {
  const { settings, updateSubject } = useSettings()
  const { markSubjectDone } = useTasks()
  
  // 新增状态：科目筛选
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all')
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

  // 按科目过滤试卷
  const filteredExams = useMemo(() => {
    if (subjectFilter === 'all') return readyExams
    return readyExams.filter(e => e.subjectKey === subjectFilter)
  }, [subjectFilter])

  // 切换科目时重置试卷选择
  useEffect(() => {
    const first = filteredExams[0]
    if (first && first.id !== examId) {
      setExamId(first.id)
    }
  }, [subjectFilter])

  const exam = exams.find((item) => item.id === examId) ?? filteredExams[0]
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
    if (exam.subjectKey) {
      updateSubject(exam.subjectKey, { current: score })
      markSubjectDone(exam.subjectKey)
    }
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
    <div className="space-y-8">
      {/* 科目筛选栏 */}
      <section className="panel p-6">
        <div className="mb-4">
          <div className="eyebrow mb-2">科目筛选</div>
          <div className="flex flex-wrap gap-3">
            {subjects.map((s) => {
              const isActive = subjectFilter === s.key
              const count = s.key === 'all' 
                ? readyExams.length 
                : readyExams.filter(e => e.subjectKey === s.key).length
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSubjectFilter(s.key)}
                  className={`rounded-xl border-2 px-5 py-3 text-lg font-semibold transition-all ${
                    isActive
                      ? 'border-current bg-opacity-10 shadow-md'
                      : 'border-line bg-panel2 text-copy hover:border-gray-400'
                  }`}
                  style={isActive ? { color: s.color, borderColor: s.color, backgroundColor: `${s.color}15` } : {}}
                >
                  {s.label}
                  <span className={`ml-2 text-sm ${isActive ? 'opacity-80' : 'text-muted'}`}>
                    {count}套
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 该科目下的试卷选择 */}
        <div className="mt-4 pt-4 border-t border-line">
          <div className="eyebrow mb-2">
            {subjectFilter === 'all' ? '所有试卷' : `${subjects.find(s=>s.key===subjectFilter)?.label} 试卷`}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {filteredExams.map((item) => {
              const isActive = item.id === examId
              const subjColor = ({ politics: '#D97706', english: '#0F766E', math: '#5B8DB8', management: '#E15B64' } as Record<string, string>)[item.subjectKey] || '#111827'
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExamId(item.id)}
                  className={`rounded-lg border px-4 py-2 text-base transition-all ${
                    isActive
                      ? 'border-current font-semibold shadow-sm'
                      : 'border-line bg-white text-copy hover:border-gray-400'
                  }`}
                  style={isActive ? { color: subjColor, borderColor: subjColor, backgroundColor: `${subjColor}10` } : {}}
                >
                  {item.year && `·${item.year}年`} {item.setName.replace(/\d*\s*年\s*/,'').replace('（已解析）','')}
                  <span className="ml-2 text-xs opacity-70">{item.questionCount}题</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 做题区域头部 */}
      <SectionHead
        eyebrow="Practice"
        title={exam ? `${exam.subject} · ${exam.setName}` : '刷题'}
        right={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[16px]">
            <span>已做 <span className="font-bold text-ink">{done}</span>/{questions.length}</span>
            <span className="text-teal">✓ {correctCount}</span>
            <span className="text-danger">✗ {wrongCount}</span>
            <button type="button" onClick={clearRecords} className="font-medium text-rose underline-offset-4 hover:underline">
              清记录
            </button>
          </div>
        }
      />

      {submitted && latest && (
        <div className="rounded-2xl border-2 border-teal/40 bg-teal/10 p-6">
          <div className="eyebrow text-teal">Exam Submitted</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-4">
            <span className="text-[18px] font-semibold text-ink">交卷得分</span>
            <span className="text-[42px] font-black text-teal">{latest.score}</span>
            <span className="text-[16px] text-muted">/ {settings.subjects.find((s) => s.key === exam.subjectKey)?.full ?? 100} 分</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* 左侧题号与筛选 */}
        <section className="panel h-fit p-6">
          <div className="eyebrow mb-4">题型筛选</div>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const active = filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`chip text-[15px] transition-colors ${
                    active ? 'border-rose/40 bg-roseSoft text-rose' : 'border-line bg-panel2 text-copy hover:border-rose/30 hover:text-ink'
                  }`}
                >
                  {item.label}
                  {item.key === 'wrong' && wrongCount > 0 && <span className="font-bold">{wrongCount}</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="eyebrow">题号</span>
            <span className="text-[14px] text-muted">共 {visible.length} 题</span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2.5">
            {visible.map((item) => {
              const record = records[item.id]
              const state = record ? (record.correct ? 'correct' : 'wrong') : 'empty'
              const active = item.id === currentId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(item.id)}
                  className={`text-lg font-bold transition-all rounded-xl border-2 ${
                    active
                      ? 'border-rose bg-roseSoft text-rose scale-110 shadow-md'
                      : state === 'correct'
                        ? 'border-teal bg-teal/10 text-teal'
                        : state === 'wrong'
                          ? 'border-danger bg-danger/10 text-danger'
                          : 'border-line bg-white text-muted hover:border-rose/30 hover:text-ink'
                  }`}
                >
                  {item.id}
                </button>
              )
            })}
            {visible.length === 0 && <div className="col-span-5 py-8 text-center text-[15px] text-muted">暂无题目</div>}
          </div>
          
          {/* 图例 */}
          <div className="mt-6 space-y-2.5 border-t border-line pt-5 text-[14px] text-muted">
            <div className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-teal" />已答对</div>
            <div className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-danger" />错题本</div>
            <div className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-[#C9CDD2]" />未做</div>
          </div>
        </section>

        {/* 右侧答题区 */}
        <div className="min-h-[600px] min-w-0 space-y-5">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border-2 border-dashed border-line bg-panel2 p-8 text-[17px] text-muted">
              正在加载试卷…
            </div>
          ) : loadError ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border-2 border-danger/30 bg-danger/5 p-8 text-[17px] text-danger">
              {loadError}
            </div>
          ) : !question || visible.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-panel2 p-8 text-center">
              <div className="text-[18px] font-semibold text-ink">这里暂时没有题</div>
              <p className="mt-2 text-[15px] text-muted">换个筛选条件或选另一套试卷。</p>
            </div>
          ) : (
            <>
              {/* 题干框 */}
              <div className="rounded-2xl border-2 border-[#D1D5DB] bg-white p-7 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className="text-[22px] font-black text-[#111827]">第 {question.id} 题</span>
                    <span className="rounded-lg border-2 border-line bg-panel2 px-3 py-1 text-[15px] font-semibold text-muted">
                      {question.type}
                    </span>
                    <span className="text-[15px] text-muted">共 {questions.length} 题</span>
                  </div>
                  {records[question.id] && (
                    <span className={`rounded-full border-2 px-4 py-1.5 text-[14px] font-bold ${
                      records[question.id].correct
                        ? 'border-teal bg-teal/10 text-teal'
                        : 'border-danger bg-danger/10 text-danger'
                    }`}>
                      {records[question.id].correct ? '✓ 已答对' : '✗ 错题'}
                    </span>
                  )}
                </div>
                
                {isLatexQuestion || !hasSourceImage ? (
                  <div className="mt-6 whitespace-pre-wrap text-[20px] leading-9 text-[#111827]">
                    <MathText text={question.question} />
                  </div>
                ) : (
                  <div className="mt-6 w-full min-w-0 overflow-x-auto">
                    <img
                      src={`${import.meta.env.BASE_URL}exam/q${question.id}.png`}
                      alt={`第 ${question.id} 题原题`}
                      className="block h-auto w-full min-w-[650px] object-left"
                    />
                  </div>
                )}
              </div>

              {/* 选项框 */}
              <div className="rounded-2xl border-2 border-[#D1D5DB] bg-white p-6 shadow-sm">
                {question.type !== '简答' ? (
                  <div className={shortOptions ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
                    {question.options.map((option) => {
                      const letter = option.trim().charAt(0)
                      const correctSet = question.answer.replace(/[^A-D]/g, '').split('')
                      const isPicked = question.type === '多选' ? multiPicked.includes(option) : picked === option
                      let style = 'border-2 border-[#D1D5DB] bg-white text-[#111827] hover:border-[#111827] hover:bg-[#F9FAFB]'
                      if (isPicked) style = 'border-2 border-[#111827] bg-[#F3F4F6] font-bold text-[#111827]'
                      if (revealed) {
                        if (correctSet.includes(letter)) style = 'border-2 border-teal bg-teal/10 font-bold text-teal'
                        else if (isPicked) style = 'border-2 border-danger bg-danger/10 font-bold text-danger'
                        else style = 'border-2 border-[#D1D5DB] bg-white text-[#4B5563]'
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
                          className={`w-full rounded-xl border-2 px-6 py-5 text-left text-[18px] leading-relaxed transition-all ${style}`}
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
                        className="mt-2 rounded-xl bg-[#111827] px-8 py-4 text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        提交答案
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      className="h-44 w-full resize-y rounded-xl border-2 border-[#D1D5DB] bg-white p-5 text-[18px] leading-relaxed text-[#111827] outline-none focus:border-[#111827]"
                      placeholder="在这里写下你的答案…"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                    />
                    {!revealed && (
                      <div className="mt-5 flex flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={() => setRevealed(true)}
                          className="rounded-xl border-2 border-[#D1D5DB] bg-white px-6 py-3 text-[16px] font-semibold text-[#111827] hover:border-[#111827]"
                        >
                          直接看答案
                        </button>
                        <button
                          type="button"
                          onClick={() => markSelf(false)}
                          disabled={!text.trim()}
                          className="rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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
                <div className="space-y-6 rounded-2xl border-2 border-[#D1D5DB] bg-white p-7 shadow-sm">
                  <div>
                    <div className="eyebrow mb-3">正确答案</div>
                    <div className="text-[24px] font-black text-teal"><MathText text={question.answer} /></div>
                  </div>
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="eyebrow">详细解析</span>
                      <button
                        type="button"
                        onClick={() => setAiOpen((prev) => !prev)}
                        className="rounded-xl border-2 border-amber/40 bg-amber/10 px-4 py-2 text-[14px] font-bold text-amber hover:bg-amber/20"
                      >
                        ✨ AI 深度解析
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-[17px] leading-8 text-[#1F2937]">
                      <MathText text={question.explanation} />
                    </p>
                  </div>

                  {aiOpen && (
                    <div className="rounded-2xl border-2 border-line bg-panel2/60 p-6">
                      <div className="flex flex-wrap items-center gap-4">
                        <select
                          className="rounded-xl border-2 border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-[#111827]"
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
                          className="rounded-xl bg-[#111827] px-5 py-2.5 text-[15px] font-bold text-white disabled:opacity-40"
                        >
                          {aiLoading ? '分析中…' : '开始分析'}
                        </button>
                        <span className="text-[14px] text-muted">错因 · 知识点 · 复习建议</span>
                      </div>
                      {aiError && <p className="mt-5 text-[16px] text-danger">{aiError}</p>}
                      {aiText && (
                        <div className="mt-5 whitespace-pre-wrap text-[16px] leading-8 text-[#1F2937]">{aiText}</div>
                      )}
                    </div>
                  )}

                  {question.type === '简答' && (
                    <div className="flex flex-wrap items-center gap-4 border-t-2 border-line pt-6">
                      <span className="text-[16px] text-muted">自己批改：</span>
                      <button
                        type="button"
                        onClick={() => markSelf(true)}
                        className={`rounded-xl border-2 px-5 py-2.5 text-[15px] font-bold ${
                          selfMark === true ? 'border-teal bg-teal/10 text-teal' : 'border-[#D1D5DB] bg-white text-[#111827] hover:border-teal/60'
                        }`}
                      >
                        ✓ 我答对了
                      </button>
                      <button
                        type="button"
                        onClick={() => markSelf(false)}
                        className={`rounded-xl border-2 px-5 py-2.5 text-[15px] font-bold ${
                          selfMark === false ? 'border-danger bg-danger/10 text-danger' : 'border-[#D1D5DB] bg-white text-[#111827] hover:border-danger/60'
                        }`}
                      >
                        ✗ 我答错了
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 导航按钮 */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => index > 0 && goTo(visible[index - 1].id)}
                  disabled={index <= 0}
                  className="rounded-xl border-2 border-[#D1D5DB] bg-white px-6 py-3 text-[16px] font-semibold text-[#111827] hover:border-[#111827] disabled:opacity-40"
                >
                  ← 上一题
                </button>
                <div className="flex items-center gap-6">
                  <span className="text-[16px] text-muted">{index + 1} / {visible.length}</span>
                  <button
                    type="button"
                    onClick={submitExam}
                    className="rounded-xl bg-[#111827] px-7 py-3 text-[16px] font-bold text-white hover:opacity-90"
                  >
                    交卷算分
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => index < visible.length - 1 && goTo(visible[index + 1].id)}
                  disabled={index >= visible.length - 1}
                  className="rounded-xl border-2 border-[#D1D5DB] bg-white px-6 py-3 text-[16px] font-semibold text-[#111827] hover:border-[#111827] disabled:opacity-40"
                >
                  下一题 →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
