import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type {
  LearningCard,
  Question,
  ReinforcementCard,
  TestFeedback,
  ViewMode,
  WordExplanation,
} from './types'
import {
  explainWord,
  followUpExplain,
  generateFeedback,
  generateLearningCard,
  generateQuestions,
  generateReinforcementCard,
} from './utils/mockAI'

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
  const [viewMode, setViewMode] = useState<ViewMode>('home')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [topic, setTopic] = useState('')
  const [learningCard, setLearningCard] = useState<LearningCard | null>(null)
  const [reinforcementCard, setReinforcementCard] = useState<ReinforcementCard | null>(null)
  const [explanation, setExplanation] = useState<WordExplanation | null>(null)
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [feedback, setFeedback] = useState<TestFeedback | null>(null)
  const countLabel = useMemo(() => `${input.length}/${MAX_LEN}`, [input.length])
  const canSubmit = input.trim().length >= 8 && !loading && input.length <= MAX_LEN
  const currentQuestion = questions[questionIndex]
  const progress = questions.length
    ? Math.round(((questionIndex + 1) / questions.length) * 100)
    : 0

  async function startLearning() {
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      const clean = input.trim()
      const card = await generateLearningCard(clean)
      setTopic(clean)
      setLearningCard(card)
      setReinforcementCard(null)
      setExplanation(null)
      setQuestions([])
      setAnswers([])
      setFeedback(null)
      setViewMode('learning')
    } catch {
      setError('生成学习卡片失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function startQuiz() {
    if (!topic) return
    setLoading(true)
    setError('')
    try {
      const generated = await generateQuestions(topic, feedback?.weak_points)
      setQuestions(generated)
      setAnswers(new Array(generated.length).fill(''))
      setQuestionIndex(0)
      setViewMode('quiz')
    } catch {
      setError('生成测验失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function submitQuiz() {
    if (!questions.length) return
    setLoading(true)
    setError('')
    try {
      const result = await generateFeedback(questions, answers)
      setFeedback(result)
      setViewMode('feedback')
    } catch {
      setError('提交测验失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function startReinforcement() {
    if (!topic || !feedback) return
    setLoading(true)
    try {
      const card = await generateReinforcementCard(topic, feedback.weak_points)
      setReinforcementCard(card)
      setViewMode('reinforcement')
    } catch {
      setError('生成巩固卡片失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const onMouseUp = async () => {
      if (viewMode !== 'learning' && viewMode !== 'reinforcement') return
      const selected = window.getSelection()?.toString().trim()
      if (!selected || selected.length < 2 || selected.length > 80) return
      setLoading(true)
      try {
        const exp = await explainWord(selected)
        setExplanation(exp)
      } finally {
        setLoading(false)
      }
    }

    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [viewMode])

  async function submitFollowUp() {
    if (!explanation || !followUpQuestion.trim()) return
    const text = followUpQuestion.trim()
    setFollowUpQuestion('')
    setLoading(true)
    try {
      const reply = await followUpExplain(text, explanation.selected_text)
      setExplanation((prev) =>
        prev ? { ...prev, follow_ups: [...prev.follow_ups, reply] } : prev
      )
    } finally {
      setLoading(false)
    }
  }

  function resetAll() {
    setViewMode('home')
    setTopic('')
    setLearningCard(null)
    setReinforcementCard(null)
    setExplanation(null)
    setQuestions([])
    setAnswers([])
    setFeedback(null)
    setFollowUpQuestion('')
    setError('')
  }

  function renderLearningCenter() {
    const card = viewMode === 'reinforcement' ? reinforcementCard : learningCard
    if (!card) return null

    if (viewMode === 'reinforcement' && reinforcementCard) {
      return (
        <section className="center-panel">
          <h2>巩固学习卡片</h2>
          <div className="card">
            <h3>已掌握点</h3>
            <ul>{reinforcementCard.mastered_points.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="card warn">
            <h3>薄弱点</h3>
            <ul>{reinforcementCard.weak_points.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="card">
            <h3>巩固总结</h3>
            <p>{reinforcementCard.reinforcement_summary}</p>
          </div>
          <div className="card">
            <h3>常见错误</h3>
            <ul>{reinforcementCard.common_mistakes.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="card">
            <h3>修订版背诵</h3>
            <p>{reinforcementCard.revised_recitation_version}</p>
          </div>
        </section>
      )
    }

    const learn = card as LearningCard
    return (
      <section className="center-panel">
        <h2>学习卡片：{learn.topic}</h2>
        <div className="card">
          <h3>5分钟读懂版</h3>
          <p><strong>一句话定义：</strong>{learn.five_min_summary.definition}</p>
          <h4>关键点</h4>
          <ol>{learn.five_min_summary.key_points.map((x) => <li key={x}>{x}</li>)}</ol>
          <p><strong>举个例子：</strong>{learn.five_min_summary.example}</p>
        </div>
        <div className="card">
          <h3>高频考点版</h3>
          {learn.high_frequency_points.map((p) => (
            <div key={p.point} className="point">
              <strong>{p.point}</strong>
              <p>{p.explanation}</p>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>可背诵版本</h3>
          <p>{learn.recitation_version}</p>
        </div>
      </section>
    )
  }

  if (viewMode === 'quiz' && currentQuestion) {
    const currentAnswer = answers[questionIndex] || ''
    const canNext = currentAnswer.trim().length > 0
    const isLast = questionIndex === questions.length - 1

    return (
      <div className="page quiz-page">
        <main className="quiz-shell">
          <header className="quiz-head">
            <h2>测验中</h2>
            <p>第 {questionIndex + 1} / {questions.length} 题</p>
            <div className="bar"><span style={{ width: `${progress}%` }} /></div>
          </header>

          <section className="quiz-card">
            <h3>{currentQuestion.question}</h3>
            {currentQuestion.type === 'single_choice' ? (
              <div className="options">
                {currentQuestion.options?.map((opt, idx) => {
                  const label = String.fromCharCode(65 + idx)
                  const selected = currentAnswer === label
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`opt ${selected ? 'selected' : ''}`}
                      onClick={() => {
                        const next = [...answers]
                        next[questionIndex] = label
                        setAnswers(next)
                      }}
                    >
                      <strong>{label}.</strong> {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              <textarea
                className="short-answer"
                placeholder="请输入你的答案..."
                value={currentAnswer}
                onChange={(e) => {
                  const next = [...answers]
                  next[questionIndex] = e.target.value
                  setAnswers(next)
                }}
              />
            )}
          </section>

          <footer className="quiz-actions">
            <button type="button" className="ghost" onClick={() => setViewMode('learning')}>
              返回学习内容
            </button>
            {!isLast ? (
              <button
                type="button"
                className="primary"
                disabled={!canNext}
                onClick={() => setQuestionIndex((x) => x + 1)}
              >
                下一题
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                disabled={!canNext || loading}
                onClick={submitQuiz}
              >
                {loading ? '提交中...' : '提交答案'}
              </button>
            )}
          </footer>
        </main>
      </div>
    )
  }

  if (viewMode === 'feedback' && feedback) {
    return (
      <div className="page feedback-page">
        <main className="feedback-shell">
          <h2>测验结果</h2>
          <section className="card">
            <p>{feedback.overall_feedback}</p>
          </section>
          {feedback.per_question_feedback.map((item) => (
            <section key={item.question} className={`card fb ${item.result}`}>
              <h3>{item.question}</h3>
              <p><strong>结果：</strong>{item.result}</p>
              <p><strong>你的优点：</strong>{item.strengths}</p>
              <p><strong>缺失要点：</strong>{item.missing_points}</p>
              <p><strong>正确思路：</strong>{item.correction}</p>
            </section>
          ))}
          <section className="card warn">
            <h3>薄弱点总结</h3>
            <ul>{feedback.weak_points.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
          <div className="feedback-actions">
            <button type="button" className="ghost" onClick={startQuiz}>重新测验</button>
            <button type="button" className="primary" onClick={startReinforcement}>
              针对薄弱点巩固
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (viewMode === 'learning' || viewMode === 'reinforcement') {
    return (
      <div className="page learn-page">
        <header className="topbar">
          <h1>LearnLoop AI</h1>
          <button type="button" className="ghost" onClick={resetAll}>开始新主题</button>
        </header>
        <main className="learn-grid">
          <aside className="left-panel">
            <h3>输入与控制</h3>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} />
            <div className="small">{countLabel}</div>
            <button type="button" className="primary" onClick={startLearning} disabled={!canSubmit}>
              {loading ? '生成中...' : '重新生成卡片'}
            </button>
            <button type="button" className="success" onClick={startQuiz} disabled={loading}>
              开始测验
            </button>
          </aside>

          {renderLearningCenter()}

          <aside className="right-panel">
            <h3>解释与追问</h3>
            {!explanation ? (
              <p className="placeholder">选中中间学习内容中的任意文本，即可生成解释。</p>
            ) : (
              <>
                <div className="card">
                  <p><strong>划词：</strong>{explanation.selected_text}</p>
                  <p><strong>通俗解释：</strong>{explanation.simpler_explanation}</p>
                  <p><strong>例子：</strong>{explanation.example}</p>
                  <p><strong>常见误解：</strong>{explanation.common_confusion}</p>
                </div>
                {explanation.follow_ups.map((msg) => (
                  <div key={msg} className="card"><p>{msg}</p></div>
                ))}
              </>
            )}
            <div className="follow-up">
              <input
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="对这个概念有疑问？继续追问..."
              />
              <button type="button" onClick={submitFollowUp} disabled={!followUpQuestion.trim() || loading}>
                发送
              </button>
            </div>
          </aside>
        </main>
      </div>
    )
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
              placeholder="输入你想学习的主题，粘贴一段内容，或上传文件"
              onChange={(e) => setInput(e.target.value)}
              aria-label="学习主题输入"
            />
            <div className="input-footer">
              <span className="counter">{countLabel}</span>
              <button type="button" className="generate-btn" onClick={startLearning} disabled={!canSubmit}>
                {loading ? 'AI 正在生成...' : '开始学习'}
              </button>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
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
                        window.scrollTo({ top: 0, behavior: 'smooth' })
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
