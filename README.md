# LearnLoop AI Demo

一个可运行的前端 + 后端示例：

- 前端：React + Vite
- 后端：Express
- 模型：DeepSeek Chat API

## 1) 配置环境变量

复制 `.env.example` 为 `.env`，填入你的 DeepSeek key：

```bash
cp .env.example .env
```

`.env` 里最少需要：

```env
DEEPSEEK_API_KEY=你的真实密钥
DEEPSEEK_MODEL=deepseek-chat
PORT=8787
```

## 2) 安装依赖

```bash
npm install
```

## 3) 启动前后端

```bash
npm run dev:full
```

默认地址：

- 前端：`http://localhost:5173`
- API：`http://localhost:8787`

## 省钱控制（已内置）

- 输入最少 8 字，最多 1200 字
- 每分钟每 IP 最多 8 次请求
- 同问题结果缓存 10 分钟（命中不再调用模型）
- `max_tokens` 限制为 450
