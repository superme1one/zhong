# AI 你画我猜（Next.js）

一个基于 Next.js 的在线你画我猜网页游戏：玩家在画布作画，后端通过 **直接 HTTP 请求** 调用 GPT-5.2 Codex 接口进行猜图（无 SDK）。

## 启动

```bash
npm install
npm run dev
```

访问 <http://localhost:3000>

## 环境变量

创建 `.env.local`：

```bash
OPENAI_API_KEY=你的密钥
CODEX_API_URL=https://api.openai.com/v1/responses
CODEX_MODEL=gpt-5.2-codex
```

## 说明

- 前端把画布导出为 base64 PNG，并发送到 `/api/guess`。
- API 路由直接 `fetch` 远程模型地址，不使用任何 SDK。
- 模型需支持图像输入与 JSON 文本输出。
