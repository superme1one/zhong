import { NextResponse } from "next/server";

const API_URL = process.env.CODEX_API_URL ?? "https://api.openai.com/v1/responses";
const MODEL = process.env.CODEX_MODEL ?? "gpt-5.2-codex";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageData?: string };
    if (!body.imageData?.startsWith("data:image/")) {
      return NextResponse.json({ error: "无效的图片数据" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "服务器缺少 OPENAI_API_KEY 配置" },
        { status: 500 },
      );
    }

    const completion = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "你是你画我猜游戏里的猜图AI。请根据用户绘画给出最可能的猜测，并输出严格JSON：{\"guess\":\"...\",\"confidence\":\"高|中|低\",\"reason\":\"...\"}",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "请猜测这张画是什么，只返回JSON。",
              },
              {
                type: "input_image",
                image_url: body.imageData,
              },
            ],
          },
        ],
      }),
    });

    if (!completion.ok) {
      const err = await completion.text();
      return NextResponse.json({ error: `上游AI请求失败: ${err}` }, { status: 502 });
    }

    const data = (await completion.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    const text =
      data.output_text ??
      data.output?.flatMap((o) => o.content ?? []).find((c) => c.type?.includes("text"))
        ?.text;

    if (!text) {
      return NextResponse.json(
        { error: "AI未返回可解析文本" },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(text) as {
      guess?: string;
      confidence?: string;
      reason?: string;
    };

    return NextResponse.json({
      guess: parsed.guess ?? "未知",
      confidence: parsed.confidence ?? "低",
      reason: parsed.reason ?? "AI 未提供理由",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
