import type { Settings } from '../config/settings'

export type AIProvider = 'ollama' | 'deepseek'

export interface AIQuestionContext {
  subject: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
}

function buildPrompt(context: AIQuestionContext): string {
  return `你是河北专升本 ${context.subject} 的资深辅导老师。学生做错了下面这道题，请给出：
1. 错误原因（一句话）
2. 涉及的知识点（列出考纲章节）
3. 针对性的复习建议（3 条以内，具体到动作）
4. 一句话提醒，避免再错

题目：${context.question}
学生答案：${context.userAnswer || '（未作答）'}
正确答案：${context.correctAnswer}
现有解析：${context.explanation}

请用简洁中文回答，不要输出多余客套话。`
}

/** 本机 Ollama：无需联网，适合离线备考 */
async function askOllama(settings: Settings, prompt: string): Promise<string> {
  const url = `${settings.ollamaUrl.replace(/\/$/, '')}/api/generate`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: settings.ollamaModel, prompt, stream: false }),
  })
  if (!response.ok) throw new Error(`Ollama 返回 ${response.status}，请确认本机服务已启动`)
  const data = (await response.json()) as { response?: string }
  if (!data.response) throw new Error('Ollama 没有返回内容')
  return data.response.trim()
}

/** DeepSeek 外部 API：密钥只从本地设置读取 */
async function askDeepSeek(settings: Settings, prompt: string): Promise<string> {
  if (!settings.deepSeekKey.trim()) throw new Error('请先在设置页填写 DeepSeek API Key')
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.deepSeekKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      stream: false,
    }),
  })
  if (!response.ok) throw new Error(`DeepSeek 返回 ${response.status}，请检查密钥或额度`)
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek 没有返回内容')
  return content.trim()
}

export async function analyzeQuestion(
  provider: AIProvider,
  settings: Settings,
  context: AIQuestionContext,
): Promise<string> {
  const prompt = buildPrompt(context)
  return provider === 'ollama' ? askOllama(settings, prompt) : askDeepSeek(settings, prompt)
}
