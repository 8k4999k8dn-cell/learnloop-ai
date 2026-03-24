import { useMemo, useState } from 'react'
import './App.css'

const MAX_LEN = 20000

const topicGroups = [
  {
    title: 'AI 基础概念',
    desc: '适合刚开始接触 AI，想快速建立基础认知的用户',
    tags: [
      'NLP 是什么',
      'RAG 是什么',
      'Agent 是什么',
      'Prompt 是什么',
      '多模态模型是什么',
      '大模型和传统机器学习有什么区别',
    ],
  },
  {
    title: '热门 AI 产品怎么快速上手',
    desc: '适合想快速了解主流 AI 产品用途、差异和上手方式的用户',
    tags: [
      'Cursor 怎么快速上手',
      'Coze 怎么快速上手',
      'Claude 怎么快速上手',
      'OpenClaw 怎么快速上手',
      'OpenCode 怎么快速上手',
      'ChatGPT 怎么高效使用',
    ],
  },
  {
    title: 'AI 实战技能',
    desc: '适合已经懂一点概念，想直接学习"怎么做"的用户',
    tags: [
      '怎么开始 vibe coding',
      '怎么做一个简单的 RAG 应用',
      '怎么用 AI 写一个网页 MVP',
      '怎么设计一个 AI Agent 产品',
      '怎么写高质量 Prompt',
      '怎么用 AI 做竞品分析',
    ],
  },
  {
    title: 'AI 进阶原理',
    desc: '适合会使用 AI 工具，但想进一步理解原理和边界的用户',
    tags: [
      'RAG 和微调有什么区别',
      'Function Calling 是什么',
      'MCP 是什么',
      '上下文窗口是什么',
      '大模型为什么会幻觉',
      '为什么 Agent 比普通聊天更强',
    ],
  },
]

function App() {
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const countLabel = useMemo(() => `${input.length}/${MAX_LEN}`, [input.length])
  const canSubmit = input.trim().length >= 8 && !loading
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''

  async function generateCard() {
    if (!canSubmit) return
    setError('')
    setLoading(true)

    try {
      const resp = await fetch(`${apiBase}/api/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: input.trim() }),
      })

      const data = (await resp.json()) as { error?: string; answer?: string; fromCache?: boolean }
      if (!resp.ok || !data.answer) {
        setAnswer('')
        setFromCache(false)
        setError(data.error || '生成失败，请稍后重试')
        return
      }

      setAnswer(data.answer)
      setFromCache(Boolean(data.fromCache))
    } catch {
      setAnswer('')
      setFromCache(false)
      setError('网络异常，请检查 API 服务是否启动')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <main className="shell">
        <section className="hero">
          <h1 className="title">LearnLoop AI</h1>
          <p className="subtitle">AI 驱动的智能学习助手</p>
          <h2 className="headline">快速理解 · 即时追问 · 轻量测验</h2>
          <p className="lead">
            输入任何主题或上传文件，AI 帮你 5 分钟建立认知框架，再通过互动问答深化理解
          </p>

          <div className="input-card">
            <textarea
              value={input}
              maxLength={MAX_LEN}
              placeholder="例如：我想快速理解 RAG 的核心原理、适用场景和常见坑点"
              onChange={(e) => setInput(e.target.value)}
              aria-label="学习主题输入"
            />
            <div className="input-footer">
              <span className="counter">{countLabel}</span>
              <button type="button" className="generate-btn" onClick={generateCard} disabled={!canSubmit}>
                {loading ? '生成中...' : '生成学习卡片'}
              </button>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          {answer && (
            <article className="answer-card" aria-live="polite">
              <div className="answer-head">
                <h3>学习卡片</h3>
                {fromCache && <span>缓存命中（省 token）</span>}
              </div>
              <pre>{answer}</pre>
            </article>
          )}
        </section>

        <section className="topics">
          <h2>热门 AI 学习主题</h2>
          <p className="topics-sub">点击任意主题，5 分钟快速学懂</p>

          <div className="topic-grid">
            {topicGroups.map((group) => (
              <article key={group.title} className="topic-card">
                <h3>{group.title}</h3>
                <p>{group.desc}</p>
                <div className="chip-wrap">
                  {group.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setInput(tag)
                        setError('')
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
