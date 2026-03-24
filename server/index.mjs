import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

const PORT = Number(process.env.PORT || 8787)
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const CORS_ORIGIN = process.env.CORS_ORIGIN || ''

const MAX_INPUT_LENGTH = 1200
const MIN_INPUT_LENGTH = 8
const MAX_OUTPUT_TOKENS = 450
const REQUESTS_PER_MINUTE = 8
const CACHE_TTL_MS = 10 * 60 * 1000

const ipBuckets = new Map()
const responseCache = new Map()

const allowedOrigins = CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server and health checks with no origin.
      if (!origin) return callback(null, true)
      if (allowedOrigins.length === 0) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(express.json({ limit: '32kb' }))

function cleanOldBuckets(now) {
  for (const [ip, bucket] of ipBuckets) {
    if (now - bucket.windowStart > 60_000) {
      ipBuckets.delete(ip)
    }
  }
}

function cleanOldCache(now) {
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key)
    }
  }
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'unknown'
}

function hashPrompt(prompt) {
  return crypto.createHash('sha256').update(prompt).digest('hex')
}

function makeStudyPrompt(topic) {
  return [
    '你是学习助手。请针对用户主题输出可执行、简洁、结构清晰的学习卡片。',
    '输出格式必须严格包含以下 5 部分：',
    '1) 一句话定义',
    '2) 关键概念（3-5条）',
    '3) 常见误区（2-3条）',
    '4) 5分钟行动清单（3条）',
    '5) 追问问题（3条）',
    '请使用中文，避免废话，不要使用 markdown 标题符号。',
    `用户主题：${topic}`,
  ].join('\n')
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: DEEPSEEK_MODEL })
})

app.post('/api/learn', async (req, res) => {
  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY 未配置' })
  }

  const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : ''

  if (topic.length < MIN_INPUT_LENGTH) {
    return res.status(400).json({ error: `请输入至少 ${MIN_INPUT_LENGTH} 个字符` })
  }

  if (topic.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `输入过长，请控制在 ${MAX_INPUT_LENGTH} 字以内` })
  }

  const now = Date.now()
  cleanOldBuckets(now)
  cleanOldCache(now)

  const ip = getClientIp(req)
  const bucket = ipBuckets.get(ip) || { count: 0, windowStart: now }
  if (now - bucket.windowStart > 60_000) {
    bucket.count = 0
    bucket.windowStart = now
  }
  bucket.count += 1
  ipBuckets.set(ip, bucket)

  if (bucket.count > REQUESTS_PER_MINUTE) {
    return res.status(429).json({ error: '请求过于频繁，请稍后再试' })
  }

  const cacheKey = hashPrompt(topic)
  const cached = responseCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return res.json({ fromCache: true, answer: cached.answer })
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: 'system', content: '你是严谨、简洁的学习教练。' },
          { role: 'user', content: makeStudyPrompt(topic) },
        ],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(502).json({ error: `DeepSeek 请求失败: ${response.status}`, detail: text.slice(0, 300) })
    }

    const data = await response.json()
    const answer = data?.choices?.[0]?.message?.content?.trim()

    if (!answer) {
      return res.status(502).json({ error: '模型未返回有效内容' })
    }

    responseCache.set(cacheKey, {
      answer,
      expiresAt: now + CACHE_TTL_MS,
    })

    return res.json({ fromCache: false, answer })
  } catch (error) {
    return res.status(500).json({
      error: '服务暂时不可用',
      detail: error instanceof Error ? error.message : String(error),
    })
  }
})

app.listen(PORT, () => {
  console.log(`LearnLoop API running on http://localhost:${PORT}`)
})
