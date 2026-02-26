"use client";

import { useEffect, useRef, useState } from "react";

type GuessResult = {
  guess: string;
  confidence: string;
  reason: string;
};

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [history, setHistory] = useState<GuessResult[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#111827";
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setResult(null);
  };

  const guessDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsGuessing(true);
    try {
      const imageData = canvas.toDataURL("image/png");
      const response = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "AI 猜测失败");
      }
      const data = (await response.json()) as GuessResult;
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 6));
    } catch (error) {
      const message = error instanceof Error ? error.message : "请求失败";
      setResult({ guess: "无法识别", confidence: "低", reason: message });
    } finally {
      setIsGuessing(false);
    }
  };

  return (
    <main>
      <h1>🎨 AI 你画我猜</h1>
      <p>在画布上自由作画，然后点击“让 AI 猜猜看”。</p>
      <div className="grid">
        <section>
          <div className="canvas-wrap">
            <canvas
              ref={canvasRef}
              width={760}
              height={500}
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={stopDraw}
              onPointerLeave={stopDraw}
            />
          </div>
          <div className="controls">
            <div className="actions">
              <button type="button" onClick={guessDrawing} disabled={isGuessing}>
                {isGuessing ? "AI 正在思考..." : "让 AI 猜猜看"}
              </button>
              <button type="button" className="secondary" onClick={clearCanvas}>
                清空画布
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="result">
            <h2>当前结果</h2>
            {result ? (
              <>
                <p>
                  <strong>AI 猜测：</strong>
                  {result.guess}
                </p>
                <p>
                  <strong>置信度：</strong>
                  {result.confidence}
                </p>
                <p>
                  <strong>理由：</strong>
                  {result.reason}
                </p>
              </>
            ) : (
              <p>还没有猜测结果，快画一幅吧！</p>
            )}
          </div>

          <div className="history">
            <h2>最近猜测</h2>
            {history.length === 0 ? (
              <p>暂无历史记录。</p>
            ) : (
              <ul>
                {history.map((item, idx) => (
                  <li key={`${item.guess}-${idx}`}>
                    {item.guess}（{item.confidence}）
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
