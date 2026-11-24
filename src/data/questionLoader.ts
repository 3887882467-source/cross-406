import examIndex from './meta/exam_index.json'
import type { ExamMeta, Question } from '../types'

export const exams = examIndex.exams as ExamMeta[]
export const examIndexInfo = {
  version: examIndex.version,
  generatedAt: examIndex.generatedAt,
  sourceDir: examIndex.sourceDir,
  note: examIndex.note,
}

/** Vite 按 glob 生成独立 chunk：只有真正打开某套试卷时才下载对应 JSON */
const loaders = import.meta.glob('./questions/*.json') as Record<
  string,
  () => Promise<{ default: Question[] }>
>

export async function loadExam(exam: ExamMeta): Promise<Question[]> {
  if (exam.status !== 'ready' || !exam.file) return []
  const key = `./questions/${exam.file}`
  const loader = loaders[key]
  if (!loader) throw new Error(`找不到试卷文件：${exam.file}`)
  const module = await loader()
  return module.default
}
