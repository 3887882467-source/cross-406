import { Fragment, type ReactNode } from 'react'
import katex from 'katex'

function renderMath(source: string, displayMode: boolean, key: number): ReactNode {
  try {
    const html = katex.renderToString(source, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
    })
    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />
  } catch {
    return (
      <span key={key} className="text-[#111827]">
        {source}
      </span>
    )
  }
}

/**
 * 把包含 $行内公式$ 与 $$独立公式$$ 的文本渲染成 HTML。
 * 普通文字原样输出，兼容题库里的 LaTeX 源码。
 */
export default function MathText({ text, className }: { text: string; className?: string }) {
  const nodes: ReactNode[] = []
  let key = 0

  const pushInline = (source: string) => {
    const inline = /\$([^$\n]+?)\$/g
    let last = 0
    let match: RegExpExecArray | null
    while ((match = inline.exec(source)) !== null) {
      if (match.index > last) {
        nodes.push(<Fragment key={key++}>{source.slice(last, match.index)}</Fragment>)
      }
      nodes.push(renderMath(match[1], false, key++))
      last = match.index + match[0].length
    }
    if (last < source.length) {
      nodes.push(<Fragment key={key++}>{source.slice(last)}</Fragment>)
    }
  }

  const block = /\$\$([\s\S]+?)\$\$/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = block.exec(text)) !== null) {
    if (match.index > last) pushInline(text.slice(last, match.index))
    nodes.push(renderMath(match[1], true, key++))
    last = match.index + match[0].length
  }
  if (last < text.length) pushInline(text.slice(last))

  return <span className={className}>{nodes}</span>
}
