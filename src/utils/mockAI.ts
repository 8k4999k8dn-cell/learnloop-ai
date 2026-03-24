import type {
  LearningCard,
  Question,
  ReinforcementCard,
  TestFeedback,
  WordExplanation,
} from '../types'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const samples = [
  '该主题的核心是“先建立框架，再补细节”，先明确定义，再看边界与应用。',
  '这类概念通常有三层：定义层、机制层、应用层；理解时按这三层拆分会更快。',
  '如果只记结论，容易遗忘；把概念和一个具体场景绑定，记忆会更稳定。',
]

export async function generateLearningCard(topic: string): Promise<LearningCard> {
  await wait(1200)
  return {
    topic,
    five_min_summary: {
      definition: `${topic} 是一种把复杂问题结构化理解的方法：先掌握主线，再理解细节与限制。`,
      key_points: [
        '核心目标：快速建立可复述的认知框架。',
        '关键步骤：定义概念 -> 拆分要点 -> 结合场景验证。',
        '适用场景：新知识入门、考前复习、工作中的快速上手。',
        '常见误区：只背术语，不做场景化理解。',
      ],
      example: `举例：学习「${topic}」时，先回答“它解决什么问题”，再看“如何实现”，最后看“何时不适用”。`,
    },
    high_frequency_points: [
      {
        point: '考点1：核心定义与边界',
        explanation: `说明 ${topic} 的定义、目标和不适用边界，避免概念泛化。`,
      },
      {
        point: '考点2：关键机制',
        explanation: `解释 ${topic} 的工作机制、输入输出和关键环节。`,
      },
      {
        point: '考点3：实践场景',
        explanation: `结合真实业务场景说明什么时候该用、什么时候不该用。`,
      },
    ],
    recitation_version: `${topic} 的记忆口诀：先定义、再机制、后场景。定义回答“是什么”，机制回答“怎么做”，场景回答“何时用”，最后补充“常见误区”。`,
  }
}

export async function explainWord(selectedText: string): Promise<WordExplanation> {
  await wait(900)
  return {
    selected_text: selectedText,
    simpler_explanation: `「${selectedText}」可以理解为：把复杂术语翻译成“目的 + 方法 + 结果”的一句话。`,
    example: `例如在学习卡片里看到「${selectedText}」，你可以先问：它解决什么问题？然后找一个真实使用场景。`,
    common_confusion: `常见误解是把「${selectedText}」当成孤立概念去背，正确做法是和流程、场景一起记。`,
    follow_ups: [],
  }
}

export async function followUpExplain(
  question: string,
  contextText: string
): Promise<string> {
  await wait(900)
  const pick = samples[Math.floor(Math.random() * samples.length)]
  return `追问：${question}\n基于「${contextText}」的补充：${pick}`
}

export async function generateQuestions(topic: string, weakPoints?: string[]): Promise<Question[]> {
  await wait(1000)
  const focus = weakPoints?.[0] || `${topic} 的核心机制`
  return [
    {
      type: 'single_choice',
      question: `关于「${topic}」，以下哪项最符合“先建立框架”的学习策略？`,
      options: [
        '先背所有术语定义，再考虑场景',
        '先明确目标和主线，再补细节',
        '先做大量练习，不做概念梳理',
        '只看一个案例，直接下结论',
      ],
      correct_option: 'B',
      reference_answer: 'B：先建立主线，再补充细节，是高效学习的关键。',
    },
    {
      type: 'single_choice',
      question: `「${focus}」最需要避免的误区是：`,
      options: ['忽略边界条件', '关注输入输出', '结合真实场景', '总结反例'],
      correct_option: 'A',
      reference_answer: 'A：忽略边界会导致理解失真。',
    },
    {
      type: 'short_answer',
      question: `请用 3 句话说明你如何把「${topic}」应用到一个真实场景。`,
      reference_answer:
        '应包含：场景描述、该概念如何发挥作用、评估是否有效的标准。',
      scoring_points: ['场景明确', '机制正确', '评估标准清晰'],
    },
  ]
}

export async function generateFeedback(
  questions: Question[],
  answers: string[]
): Promise<TestFeedback> {
  await wait(1200)
  const per = questions.map((q, idx) => {
    const answer = (answers[idx] || '').trim()
    if (!answer) {
      return {
        question: q.question,
        result: 'incorrect' as const,
        strengths: '暂未作答',
        missing_points: '缺少关键结论与解释。',
        correction: q.reference_answer,
      }
    }
    if (q.type === 'single_choice') {
      const ok = answer.toUpperCase() === q.correct_option
      return {
        question: q.question,
        result: ok ? ('correct' as const) : ('partial' as const),
        strengths: ok ? '选择正确，概念判断准确。' : '有尝试但判断依据不够稳定。',
        missing_points: ok ? '可补充反例以增强理解。' : '需补充核心定义与边界条件。',
        correction: q.reference_answer,
      }
    }
    const strong = answer.length > 30
    return {
      question: q.question,
      result: strong ? ('partial' as const) : ('incorrect' as const),
      strengths: strong ? '有场景意识，表达较完整。' : '有基本方向。',
      missing_points: strong ? '缺少明确评估指标。' : '缺少完整应用路径。',
      correction: q.reference_answer,
    }
  })

  const weak = per
    .filter((x) => x.result !== 'correct')
    .map((x) => x.question.slice(0, 20))
    .slice(0, 3)

  return {
    overall_feedback:
      weak.length === 0
        ? '整体表现优秀：你已经能准确理解并应用核心概念。'
        : '你已掌握基础主线，建议针对薄弱点做一次定向巩固后再测。',
    per_question_feedback: per,
    weak_points: weak.length ? weak : ['暂无明显薄弱点，可直接进阶学习。'],
  }
}

export async function generateReinforcementCard(
  topic: string,
  weakPoints: string[]
): Promise<ReinforcementCard> {
  await wait(1100)
  return {
    mastered_points: [
      `已掌握 ${topic} 的基础定义`,
      '能区分主线与细节信息',
      '能用简单场景解释概念',
    ],
    weak_points: weakPoints.length ? weakPoints : ['边界条件判断', '应用评估指标'],
    reinforcement_summary:
      '巩固策略：先把每个薄弱点写成“定义 + 场景 + 反例”三行卡片，再用 2 分钟口述复盘。',
    common_mistakes: [
      '只记结论，不验证适用范围',
      '缺少反例，导致概念泛化',
      '应用场景描述过泛，缺少评估标准',
    ],
    revised_recitation_version:
      '修订版背诵：先说核心定义，再给一个可用场景，再补一个不适用场景，最后说判断标准。',
  }
}
