import type {
  LearningCard,
  Question,
  ReinforcementCard,
  TestFeedback,
  WordExplanation,
} from '../types'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 模拟「系统提示」：禁止空泛方法论，必须紧扣用户主题/划词输出可核对知识点 */
const SYSTEM_CARD_RULES = [
  '你是严谨的技术与产品学习教练。',
  '禁止输出「先建立框架」「多维度理解」等泛泛而谈，除非该句紧接着给出与用户主题直接相关的具体信息。',
  '每一句话必须以用户主题中的实体（工具名、概念名、流程名）或可操作的判断标准结尾或开头，让读者能拿去考试或落地。',
  '若主题是一个名词，定义中必须交代：它属于哪一类系统/协议/模型能力，解决什么输入→输出问题。',
].join('\n')

type CurriculumEntry = {
  test: (t: string) => boolean
  build: (topic: string) => LearningCard
}

const curriculum: CurriculumEntry[] = [
  {
    test: (t) => /rag|检索增强/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          'RAG（Retrieval-Augmented Generation，检索增强生成）指：在生成答案前，先从外部知识库检索与问题相关的文档片段，再把检索结果与用户问题一起交给语言模型生成——从而把模型参数里「没有」的时效知识或私有文档接进回答里。',
        key_points: [
          '流程骨架：用户问题 → 向量化/检索（Top-K 片段）→ 将片段作为上下文拼接进 Prompt → 模型据此生成并引用要点。',
          '与纯提示词补全的区别：关键证据来自「检索到的文本块」，而不是只靠模型记忆；适合企业内部文档、帮助中心、最新政策等。',
          '常见工程要点：切片策略（chunk size/overlap）、向量库与重排序（rerank）、引用标注、超时与空检索回退。',
          '典型坑：检索到无关片段导致「幻觉式复述」；上下文过长吞掉关键句；不清洗 PDF/表格导致噪声。',
        ],
        example:
          '用户问「某 SKU 退货规则」：系统先从电商政策 PDF 中检索含「退货」章节的三段文字，把这三段和用户问题一起发给模型，模型输出规则摘要并注明依据段落——这是标准 RAG 场景。',
      },
      high_frequency_points: [
        {
          point: '考点：RAG 解决的是「知识在库中但不在模型参数里」哪类问题？',
          explanation:
            '解决知识可更新、可私域部署的问题：不必为每周更新的手册再训练大模型，而是更新向量库/索引即可。',
        },
        {
          point: '考点：检索质量通常比模型大小更先成为瓶颈时怎么办？',
          explanation:
            '优先改索引与查询：更好的分词/分块、混合检索（关键词+向量）、rerank、查询改写（HyDE 等），再考虑换更大模型。',
        },
        {
          point: '考点：引用（citation）在产品上为什么重要？',
          explanation:
            '可追溯：用户可点回原文核对；降低法律与客服风险；也方便你 debug 是「检索错」还是「生成错」。',
        },
      ],
      recitation_version:
        'RAG = 检索 Top-K 文档片段 + 拼进 Prompt 再生成；强项是私域与可更新知识；要盯切片、检索、重排和引用；坏检索会带来胡说八道。',
    }),
  },
  {
    test: (t) => /\bmcp\b|MCP 是什么/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          'MCP（Model Context Protocol）是 Anthropic 推进的一种开放协议，用于让 AI 助手以统一方式连接外部「工具与数据源」——例如读本地文件、调数据库、走 HTTP API——由主机（如 IDE/客户端）托管能力，模型通过标准化消息与主机协作。',
        key_points: [
          '三角色：Host（宿主，如 Cursor）、Client（会话桥）、Server（提供资源/工具的进程）。',
          '能力形态：Resources（可读资源）、Tools（可调函数）、Prompts（可复用提示模板）等，具体以实现为准。',
          '与「写死一个插件」相比：协议层统一后，不同模型/宿主可用同一套 server 适配逻辑（取决于生态支持）。',
          '安全：任何能执行代码或访问私密数据的 MCP server 都要当「高敏服务」做权限与白名单。',
        ],
        example:
          '在 Cursor 里启用 Figma MCP：宿主把「读设计文件/节点」的能力暴露给模型；你在对话里让它拉取结构，它通过 MCP 调用 server 而非自己猜 URL。',
      },
      high_frequency_points: [
        {
          point: '考点：MCP 解决的核心痛点是什么？',
          explanation:
            '减少「每个工具一个定制集成」的碎片化：用统一契约描述能力与调用方式，便于宿主侧编排。',
        },
        {
          point: '考点：为什么 MCP 不等于「模型自己会 HTTP」？',
          explanation:
            '模型本身受沙箱与密钥管理限制；MCP 把「谁能访问什么」放在受控的 host/server 侧。',
        },
        {
          point: '考点：接入后要优先测什么？',
          explanation:
            '权限边界、超时、错误传播、以及敏感操作（写文件/执行命令）是否二次确认。',
        },
      ],
      recitation_version:
        'MCP=主机托管的标准化工具总线；Host/Client/Server；Resources/Tools/Prompts；安全第一，别乱给 server 权限。',
    }),
  },
  {
    test: (t) => /nlp|自然语言/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          'NLP（Natural Language Processing，自然语言处理）是计算机科学中让机器理解、生成或转换人类语言的一类技术总称：从分词、句法、语义到对话与翻译，输出可以是标签、结构化信息或新文本。',
        key_points: [
          '传统管线：分词/NER/依存句法/语义角色标注等模块化任务；深度学习后多为端到端或大模型统一建模。',
          '与「大模型」关系：大模型强在零样本/少样本与通用生成；结构化抽取有时仍要配合规则或小模型降本。',
          '评价指标因任务而异：分类看 F1，翻译看 BLEU，摘要/对话看人工与 LLM-as-judge（注意偏差）。',
        ],
        example:
          '客服工单「自动填槽」：NLP 从用户来信里抽「订单号、问题类型、情绪」——可能用规则+NER，也可能用大模型 JSON 模式输出。',
      },
      high_frequency_points: [
        {
          point: '考点：为什么说 NLP 不等于 ChatGPT？',
          explanation:
            'NLP 是领域；ChatGPT 类产品是「以大模型为核心的应用形态」，底层用到 NLP 也可能叠加检索、编排、工具调用。',
        },
        {
          point: '考点：线上系统里最常见的 NLP 工程问题？',
          explanation:
            '领域漂移（新词、新说法）、长文本截断、延迟与成本、以及模型输出的可解析性（要稳定 JSON）。',
        },
      ],
      recitation_version:
        'NLP=让机器处理人类语言的广义技术；任务决定指标；大模型是新范式但要和成本、结构化与安全配套。',
    }),
  },
  {
    test: (t) => /agent|智能体/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          'AI Agent（智能体）通常指：以大模型为推理核心，能够在循环中「感知状态 → 规划子目标 → 选择并调用工具 → 观察结果再迭代」的系统；区别于单次问答，它强调多步自治与外部世界交互。',
        key_points: [
          '关键能力链：规划（plan）、记忆（短期上下文+长期存储）、工具使用（API/代码执行）、反思与终止条件。',
          '风险：工具滥用、无限循环、提示注入、权限过大；生产上要加预算、护栏与人机确认。',
          '与 workflow 编排差异：Agent 更「让模型自主分叉」；workflow 更「人预先画好 DAG」。',
        ],
        example:
          '「研究助理 Agent」：先搜索最新论文 → 抽取方法对比表 → 调用 Python 画趋势图 → 把图表与结论写入报告草稿——每步都可能失败需要重试。',
      },
      high_frequency_points: [
        {
          point: '考点：什么时候该用 Agent，什么时候不该？',
          explanation:
            '路径固定且可预测用工作流更稳；探索空间大、工具多、需要临场拆解任务时才上 Agent，并设好停止条件。',
        },
      ],
      recitation_version:
        'Agent=多步推理+工具循环；要规划/记忆/工具/终止；防循环与越权是上线必答题。',
    }),
  },
  {
    test: (t) => /prompt|提示词/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          'Prompt（提示词）是给生成式模型的输入指令与上下文总称：不仅包括「一句话任务」，还包括角色、输出格式示例、必须引用的材料、以及否定约束（不要编造、不要出界）。',
        key_points: [
          '高质量结构：任务 + 输入数据 + 输出格式（JSON schema/字段表）+ 失败时行为 + 领域术语表。',
          '稳定性技巧：少用语义模糊的「更好」「专业」，改为可验证标准（长度、字段、引用要求）。',
          '安全：明确拒绝越权请求；对工具调用场景提示「先确认参数再执行」。',
        ],
        example:
          '要模型输出可解析 JSON：在 Prompt 里贴「仅输出 JSON，顶层 keys 为 a,b,c，不要 markdown」，并给一个完整小例子。',
      },
      high_frequency_points: [
        {
          point: '考点：Prompt 工程与微调的关系？',
          explanation:
            'Prompt 改的是「当下这一局怎么对齐目标」；微调改的是模型权重里长期偏好——两者可叠加。',
        },
      ],
      recitation_version:
        'Prompt=指令+上下文+格式+失败策略；要写清可验证输出；和安全边界写在一起。',
    }),
  },
  {
    test: (t) => /多模态/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          '多模态大模型指：同一套（或联合训练的）模型能同时处理多种输入模态（常见为文本+图像，亦可含音频/视频），并在统一语义空间里推理或生成跨模态结果。',
        key_points: [
          '典型能力：看图问答、文档图表理解、UI 截图→代码草稿、视频分段摘要（取决于模型与产品裁剪）。',
          '工程要点：分辨率与 token 换算、OCR/布局噪声、时序截断；输出仍要做幻觉审查。',
        ],
        example:
          '给一张系统报错截图：模型读状态栏与弹窗文字，推断可能原因并给出排查步骤——依赖视觉编码器+语言解码器协同。',
      },
      high_frequency_points: [
        {
          point: '考点：多模态是否意味着「一定比单模态更准」？',
          explanation:
            '不一定；模态越多，训练与对齐越难，且你的评测要覆盖跨模态陷阱（图表误读、视觉幻觉）。',
        },
      ],
      recitation_version:
        '多模态=跨模态统一表征与推理；关注 token、噪声与幻觉；评测要比单模态更严。',
    }),
  },
  {
    test: (t) => /微调|fine-?tun/i.test(t) && /大模型|传统机器|区别/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          '大模型与传统机器学习：传统 ML 往往特征工程+小模型+结构化数据；大模型用大规模预训练获得通用语言/多模态能力，再通过提示词、RAG、微调等适配任务。微调（Fine-tuning）是用领域数据继续更新参数，让模型「长期记住」某类风格、格式或稀缺知识（仍要与 RAG 分工）。',
        key_points: [
          '选 RAG：知识频繁变、需要引用原文、要可解释性。',
          '选微调：要固定口吻、复杂标注规范、或要把小模型推到更低延迟成本。',
          '别混为一谈：微调不替换安全护栏；也不能保证不幻觉，只能提升「像你的业务」的概率。',
        ],
        example:
          '客服回复要统一品牌语气但政策每周变：语气用轻量微调或强 Prompt；政策用 RAG 拉最新手册。',
      },
      high_frequency_points: [
        {
          point: '考点：数据泄漏与评测泄露在微调里意味着什么？',
          explanation:
            '测试集进训练会虚高；线上要留时间切分与严格 hold-out。',
        },
      ],
      recitation_version:
        '传统ML=特征+小模型；大模型=预训练+提示/RAG/微调；知识常变走 RAG，口型/格式可走微调。',
    }),
  },
  {
    test: (t) => /上下文窗口/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          '上下文窗口（context window）是模型在一次前向推理中能「同时看见」的 token 上限：包括系统提示、历史对话与附件摘要等。超出部分会被截断、摘要或外置到向量库，策略由产品实现。',
        key_points: [
          '窗口大≠一定好：成本与延迟线性或超线性涨；注意力稀释也可能让细节被埋没。',
          '工程策略：分层摘要、检索注入关键段、工具读出全文而非硬塞。',
        ],
        example:
          '200 页合同：不要整本塞窗口；先条款检索出「违约责任」相关页，再只把这几页送进模型做法条对比。',
      },
      high_frequency_points: [
        {
          point: '考点：长上下文模型的测试重点？',
          explanation:
            '「针在干草堆」式检索、远距离指代、结构化表格跨页推理。',
        },
      ],
      recitation_version:
        '上下文窗口=单次可见 token 上限；变大要花钱；长文档靠检索+摘要而不是硬塞。',
    }),
  },
  {
    test: (t) => /幻觉/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          '大模型「幻觉」指生成内容与事实或输入依据不一致却仍表述自信：包括编造引用、错误数字、捏造不存在的 API 等。根因常见为训练目标（似然最大化）≠事实核验，以及缺失可验证接地。',
        key_points: [
          '缓解：RAG 强制接地、要求引用、工具验证（计算器、执行代码）、不确定性表达、人在回路审核。',
          '产品侧：高风险场景默认拒答或降级为检索结果列表，而不是「像真的一样总结」。',
        ],
        example:
          '法律条文问答：若检索不到明确条款，应输出「未在提供的法规片段中找到」而非推测法条编号。',
      },
      high_frequency_points: [
        {
          point: '考点：评测幻觉的难点？',
          explanation:
            '真实世界事实漂移；需要动态基准或强引用对齐，而不能只看流畅度。',
        },
      ],
      recitation_version:
        '幻觉=流畅但与事实/依据不符；靠接地、引用、工具与人审；测流畅不够。',
    }),
  },
  {
    test: (t) => /function calling|工具调用/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          'Function Calling（函数调用/工具调用）是模型输出结构化「要调哪个函数、参数是什么」的协议能力，由运行时真正执行函数并把结果再喂回模型，形成「模型-工具」闭环。',
        key_points: [
          '要点：schema 严格、错误处理、幂等、超时；模型只提议，宿主裁决是否执行。',
          '与 MCP：MCP 可承载一类工具宿主，Function Calling 是模型侧的调用表达方式之一（生态各实现不同）。',
        ],
        example:
          '模型输出 `getWeather(city="上海")` → 宿主调真实天气 API → 返回 JSON → 模型用自然语言回答用户。',
      },
      high_frequency_points: [
        {
          point: '考点：为什么要限制可调用工具集合？',
          explanation:
            '防止提示注入诱导调用危险工具；缩小集合＝缩小攻击面。',
        },
      ],
      recitation_version:
        'Function calling=模型出调用单、宿主真执行；schema+权限+错误处理缺一不可。',
    }),
  },
  {
    test: (t) => /cursor/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          'Cursor 是基于 VS Code 的 AI 原生编辑器：在写代码、读仓库、改多文件时，把大模型对话、补全和（可选）MCP 工具链嵌进编辑流程；核心价值是减少「切浏览器问 AI → 手工粘贴」的摩擦。',
        key_points: [
          '@ 引用：在对话里用 @文件/@文件夹/@文档 等把上下文显式钉住，降低模型「猜路径」概率。',
          '规则与说明：用项目级规则（如 AGENTS.md、.cursor/rules）固定技术栈、命令、禁止事项，让生成结果更稳。',
          '改动审查：多文件 patch 前要看过 diff；对涉及密钥、迁移、删库的改动坚持本地跑测试或最小可复现。',
        ],
        example:
          '需求「加登录校验」：先 @相关路由文件与中间件，让模型只改这两处；再让对方给出 `npm test` 或 `pnpm lint` 命令清单，你在本地执行确认。',
      },
      high_frequency_points: [
        {
          point: '考点：为什么 @ 上下文比「整仓全塞」更重要？',
          explanation:
            '省钱省延迟且减少干扰：模型注意力被无关文件稀释时更容易改错边界条件。',
        },
      ],
      recitation_version:
        'Cursor=IDE 内嵌 AI；@ 钉上下文；项目规则锁行为；多看 diff 再合并。',
    }),
  },
  {
    test: (t) => /coze|扣子/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          'Coze（扣子）是面向搭建「对话式 Bot/工作流」的平台：用可视化编排把插件、知识库、大模型与各节点串成可发布应用；适合快速试多轮对话与业务集成。',
        key_points: [
          '知识库节点：关注切分、更新频率与引用策略；模型回答是否必须贴原文摘要。',
          '插件/HTTP：密钥与限速放在平台侧安全配置里，不要把敏感 key 写进对用户可见的提示词。',
          '调试：为每个分支准备失败兜底话术与日志字段，避免用户只看到「出错了」。',
        ],
        example:
          '客服 Bot：用户问物流 → 工作流先调订单查询插件拿状态码 → 失败则转人工节点；成功则让模型用固定模板回复并附单号。',
      },
      high_frequency_points: [
        {
          point: '考点：工作流与 Agent 自由对话如何取舍？',
          explanation:
            '路径稳定用钱路工作流；需要强推理分叉时再让模型多步决策，但仍要设最大轮次。',
        },
      ],
      recitation_version:
        'Coze=编排+插件+知识库；盯分段与密钥；分支要有兜底与可观测性。',
    }),
  },
  {
    test: (t) => /vibe coding|vibe/i.test(t),
    build: (topic) => ({
      topic,
      five_min_summary: {
        definition:
          '「vibe coding」常指：在 AI 协助下快速迭代原型——用自然语言驱动生成代码，但必须保留可读结构与最小验证节奏；不是不要工程规范，而是缩短从想法到可运行草稿的时间。',
        key_points: [
          '小步提交：每个提示只改一个明确行为，方便 diff 与回滚。',
          '验收脚本：哪怕是 `curl`/Playwright 片段，也要有「一键证明它能跑」的步骤。',
          '约束：数据库/支付/权限相关改动必须人工二审。',
        ],
        example:
          '先做「能启动的空壳路由」，再迭代鉴权，再迭代 DB——每步都让 AI 输出本步验收命令，而不是一次生成整仓。',
      },
      high_frequency_points: [
        {
          point: '考点：什么时候 vibe coding 会翻车？',
          explanation:
            '一次性改 10+ 文件且无测试；模型幻想依赖版本；忽略环境变量与秘钥管理。',
        },
      ],
      recitation_version:
        'vibe coding=快迭代+小步+每步可验证；危险品必须人审。',
    }),
  },
]

function genericSubstantiveCard(rawTopic: string): LearningCard {
  const topic = rawTopic.trim() || '（请在左侧输入具体主题或名词）'
  return {
    topic,
    five_min_summary: {
      definition: `「${topic}」——请先完成这一条可检验定义：在权威来源（官方文档、论文、标准或产品手册）中，它指代的对象是什么类型（协议/模型能力/产品模块/流程）？输入与输出各是什么？与最容易混淆的一个邻近概念相比，边界差在哪一句？`,
      key_points: [
        `【机制】列出「${topic}」涉及的 2～4 个关键环节或模块名称，并说明前一环节的输出如何成为下一环节的输入（用箭头写清数据流）。`,
        `【场景】写出一个真实使用「${topic}」的端到端例子：谁触发、触发条件、成功判据、失败时系统如何表现。`,
        `【约束】写出「${topic}」不适用的 2 类场景，并说明为什么（成本、延迟、合规或正确性）。`,
        `【对标】各用一句话对比「${topic}」与一个替代方案：何时选 A、何时选 B。`,
      ],
      example: `假设你在工作中要给人讲清楚「${topic}」：先用 30 秒口述「它解决什么问题」，再用 1 分钟画一条数据流，最后用 30 秒举一个反例说明「什么时候不该用它」。`,
    },
    high_frequency_points: [
      {
        point: `高频考点：提到「${topic}」时必须能回答的三个问题是什么？`,
        explanation: `是什么（类型与定义）、怎么做（流程与接口/操作）、何时不用（边界与反例）。`,
      },
      {
        point: `高频考点：如何把「${topic}」讲给非听众的技术同事？`,
        explanation: `用对方熟悉的类比域映射到你的定义：映射点要写清「对应关系」而不是泛泛比喻。`,
      },
      {
        point: `高频考点：若资料冲突，以什么顺序采信？`,
        explanation: `官方文档 > 可运行示例代码 > 社区博客；并记录版本号与日期。`,
      },
    ],
    recitation_version: `${topic}：定义+数据流+成功标准+反例边界；能口述 90 秒版本；能指出一个替代方案及取舍。`,
  }
}

/** 划词小词典：优先给实质定义，避免套话 */
const SELECTION_GLOSS: { pattern: RegExp; explain: (term: string, topic: string) => WordExplanation }[] = [
  {
    pattern: /RAG|检索增强/i,
    explain: (term, topic) => ({
      selected_text: term,
      simpler_explanation: `在你当前主题「${topic || '本页学习'}」里，RAG 指：先从知识库取出相关片段，再让大模型结合这些片段作答。核心不是「让模型背更多」，而是「让答案有据可查」。`,
      example: '问企业内部制度：检索返回《员工手册》第 3.2 节三段原文，模型总结时逐条对应，而不是凭印象编条款号。',
      common_confusion: '误以为 RAG 能消灭幻觉——坏检索或模型曲解片段时仍会错；需要引用、重排与人工抽检。',
      follow_ups: [],
    }),
  },
  {
    pattern: /MCP/i,
    explain: (term, topic) => ({
      selected_text: term,
      simpler_explanation: `「${term}」在 AI 工具链语境下通常指 Model Context Protocol：一种让「宿主程序」向模型暴露标准化工具/资源的方式。模型不直接拥有你的磁盘或密钥，由宿主代为执行。`,
      example: `学习主题「${topic || '你的主题'}」时，可以把 MCP 理解成 IDE 侧的「工具插座规格」：换模型时，尽量不用重写每个插件集成。`,
      common_confusion: '把 MCP 当成「模型自带能力」——实际是宿主+服务端进程配合；安全取决于宿主给了 server 多大权限。',
      follow_ups: [],
    }),
  },
  {
    pattern: /token|Token/i,
    explain: (term, topic) => ({
      selected_text: term,
      simpler_explanation: `Token 是模型处理文本时的最小计费/计长单位（可能是子词、汉字或片段）。上下文窗口、价格和延迟都与 token 数强相关。`,
      example: `谈「${topic || '本主题'}」时：长文档要先压缩或检索，否则吃满窗口后首尾细节会被挤掉。`,
      common_confusion: '把 token 当「字」——中英文与符号折算不同，需以具体模型 tokenizer 为准。',
      follow_ups: [],
    }),
  },
  {
    pattern: /嵌入|向量|embedding/i,
    explain: (term, topic) => ({
      selected_text: term,
      simpler_explanation: `Embedding 把文本变成高维向量，用来度量语义相似度；RAG 里常用「问题向量 vs 文档块向量」做近似最近邻检索。`,
      example: `围绕「${topic || '当前主题'}」：若检索总不准，优先查分块、embedding 模型是否与领域匹配、有没有加 rerank。`,
      common_confusion: '以为向量相似就等价于逻辑蕴含——语义近但仍可能答非所问，要配合业务过滤与关键字。',
      follow_ups: [],
    }),
  },
]

function defaultWordExplanation(selectedText: string, learningTopic: string): WordExplanation {
  const topic = learningTopic.trim() || '当前学习主题'
  return {
    selected_text: selectedText,
    simpler_explanation: `【紧扣「${selectedText}」】把它放回主题「${topic}」里理解：它在这个主题中扮演的角色，是「对象/动作/度量/约束」中的哪一种？用一句话写清「谁对谁做什么」。若这是专业名词，请立刻补一条可核对来源（文档章节、标准名或 API 名），禁止只形容「很重要」。`,
    example: `例如在「${topic}」的复盘里：用 2～3 个词说明「${selectedText}」出现时前后依赖的数据字段或前置条件，再举一个反例：缺了这个条件会错成什么样。`,
    common_confusion: `常见套话是把「${selectedText}」抽象成「赋能、闭环、拉齐」——应换成可观察的行为或接口名，让听众能对着系统截图指认。`,
    follow_ups: [],
  }
}

export async function generateLearningCard(topic: string): Promise<LearningCard> {
  await wait(1200)
  void SYSTEM_CARD_RULES
  const normalized = topic.trim()
  for (const entry of curriculum) {
    if (entry.test(normalized)) {
      return entry.build(normalized || topic || '当前主题')
    }
  }
  return genericSubstantiveCard(normalized || topic)
}

export async function explainWord(
  selectedText: string,
  learningTopic = ''
): Promise<WordExplanation> {
  await wait(900)
  const topic = learningTopic.trim()
  for (const row of SELECTION_GLOSS) {
    if (row.pattern.test(selectedText)) {
      return row.explain(selectedText, topic)
    }
  }
  return defaultWordExplanation(selectedText, topic)
}

export async function followUpExplain(
  question: string,
  contextText: string,
  learningTopic = ''
): Promise<string> {
  await wait(900)
  const t = learningTopic.trim()
  const q = question.trim()
  const c = contextText.trim() || '（无划词）'
  return [
    `【直接回答你的追问】${q}`,
    '',
    `【必须与划词「${c}」绑定】请把回答里的因果链写成：因为「${c}」在${t ? `主题「${t}」` : '当前语境'}中起到 ___ 作用，所以 ___；若缺少资料，明确说「我无法在你提供的材料中验证 ___」。`,
    '',
    `【可执行结论】列出 2 条读者马上能做的事（例如：去查哪类文档、写一个什么小实验验证、或避免哪一个具体配置错误）。禁止只给「多练习/多思考」。`,
  ].join('\n')
}

export async function generateQuestions(topic: string, weakPoints?: string[]): Promise<Question[]> {
  await wait(1000)
  const focus = weakPoints?.[0] || `${topic} 的核心机制`
  const t = topic.trim() || '该主题'
  return [
    {
      type: 'single_choice',
      question: `关于「${t}」，哪一条更贴近其实际工作流程（而非泛化学习法）？`,
      options: [
        '只换更大的模型，不审视输入数据形态',
        '先明确输入/输出与关键中间产物，再选模型与编排',
        '把所有知识先塞进单次提示，不做检索或摘要',
        '用更多形容词让回答「看起来更专业」',
      ],
      correct_option: 'B',
      reference_answer: 'B：工程上应先锁定数据流与中间产物，再选模型与工具。',
    },
    {
      type: 'single_choice',
      question: `结合薄弱点「${focus}」，优先应排查什么？`,
      options: [
        '调用链中哪一环的输入缺失或被截断',
        '仅增加更多训练语料而不看评测集',
        '把提示词写得更长更文学化',
        '关闭所有日志以提升速度',
      ],
      correct_option: 'A',
      reference_answer: 'A：薄弱点多来自数据流/约束没有被显式建模。',
    },
    {
      type: 'short_answer',
      question: `用两三句话，给一个与「${t}」强相关的微型场景：谁在用、触发条件是什么、如何判断成功？`,
      reference_answer: '需包含角色、触发条件、可观察成功指标，且术语与主题一致。',
      scoring_points: ['场景具体', '与主题绑定', '成功标准可验证'],
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
  const t = topic.trim() || '当前主题'
  const w = weakPoints.length ? weakPoints : ['对主题的输入/输出与边界仍不够具体']
  return {
    mastered_points: [
      `能复述「${t}」要解决的任务类型`,
      '能说出至少一个成功判据',
      '能指出一个不应使用的场景',
    ],
    weak_points: w,
    reinforcement_summary: `针对「${t}」，请把薄弱点逐条改写成「观察现象 → 可能根因 → 验证动作」：每条验证动作必须是 5 分钟内能执行的检查（读文档某节、打印某字段、跑一个最小示例），禁止只写心态类建议。`,
    common_mistakes: [
      '把主题讲成形容词堆砌，缺少可验证对象',
      '混淆相似术语且不写对照表',
      '把线上问题归因于「模型不够大」而不看数据流',
    ],
    revised_recitation_version: `${t}：一句定义 + 数据流箭头 + 成功标准 + 反例边界；薄弱点各配一个 5 分钟验证动作。`,
  }
}
