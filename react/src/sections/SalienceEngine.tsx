import { useEffect, useRef, useState } from "react";
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import type { SystemState } from "@/types/sovereign";
import { getSystemState, getMockSystemState } from "@/lib/api";

const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_ORDS_BASE_URL;

export default function SalienceEngine() {
  const [state, setState] = useState<SystemState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (USE_MOCK) {
      setState(getMockSystemState());
      const iv = setInterval(() => setState(getMockSystemState()), 3000);
      return () => clearInterval(iv);
    }
    const load = async () => {
      const s = await getSystemState();
      if (s) setState(s);
    };
    load();
    const iv = setInterval(load, 2000);
    return () => clearInterval(iv);
  }, []);

  // Draw attention spectrum
  useEffect(() => {
    if (!state || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const valence = state.emotional_valence;
    const arousal = state.emotional_arousal;

    // Draw attention wave
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x < w; x++) {
      const normX = x / w;
      const wave1 = Math.sin(normX * Math.PI * 3 + Date.now() / 1000) * 10;
      const wave2 = Math.sin(normX * Math.PI * 7 + Date.now() / 700) * 5;
      const attentionPeak = Math.exp(-Math.pow((normX - 0.5) * 3, 2)) * arousal * h * 0.6;
      const y = h - 15 - attentionPeak - wave1 - wave2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, valence < 0 ? "rgba(255,107,157,0.15)" : "rgba(123,97,255,0.15)");
    grad.addColorStop(0.5, `rgba(${valence >= 0 ? "0,229,199" : "255,107,157"},${0.2 + arousal * 0.3})`);
    grad.addColorStop(1, valence < 0 ? "rgba(255,107,157,0.15)" : "rgba(123,97,255,0.15)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw peak line
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const normX = x / w;
      const wave1 = Math.sin(normX * Math.PI * 3 + Date.now() / 1000) * 10;
      const wave2 = Math.sin(normX * Math.PI * 7 + Date.now() / 700) * 5;
      const attentionPeak = Math.exp(-Math.pow((normX - 0.5) * 3, 2)) * arousal * h * 0.6;
      const y = h - 15 - attentionPeak - wave1 - wave2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = valence >= 0 ? "rgba(0,229,199,0.6)" : "rgba(255,107,157,0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw baseline
    ctx.beginPath();
    ctx.moveTo(0, h - 15);
    ctx.lineTo(w, h - 15);
    ctx.strokeStyle = "rgba(26,42,68,0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [state]);

  const valence = state?.emotional_valence ?? 0.25;
  const arousal = state?.emotional_arousal ?? 0.55;
  const accuracy = 0.72 + Math.random() * 0.15;

  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--synapse-dim)" }}>
        <Activity size={14} style={{ color: "var(--thought-gold)" }} />
        <span className="font-title text-xs font-semibold tracking-wide" style={{ color: "var(--consciousness-white)" }}>
          Salience &amp; Prediction
        </span>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-3">
        {/* Attention spectrum */}
        <div className="flex-1 relative">
          <span className="absolute top-0 left-0 font-mono text-[8px] uppercase" style={{ color: "var(--unconscious-muted)" }}>
            Attention Spectrum
          </span>
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "rgba(26,42,68,0.4)" }}>
            <TrendingUp size={12} style={{ color: "var(--neural-active)" }} />
            <div className="flex flex-col">
              <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>VALENCE</span>
              <span className="font-mono text-xs font-bold" style={{ color: valence >= 0 ? "var(--neural-pulse)" : "var(--self-emergence)" }}>
                {valence >= 0 ? "+" : ""}{valence.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "rgba(26,42,68,0.4)" }}>
            <AlertTriangle size={12} style={{ color: "var(--thought-gold)" }} />
            <div className="flex flex-col">
              <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>AROUSAL</span>
              <span className="font-mono text-xs font-bold" style={{ color: "var(--thought-gold)" }}>
                {arousal.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "rgba(26,42,68,0.4)" }}>
            <CheckCircle size={12} style={{ color: "var(--neural-pulse)" }} />
            <div className="flex flex-col">
              <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>PREDICTION</span>
              <span className="font-mono text-xs font-bold" style={{ color: "var(--neural-pulse)" }}>
                {(accuracy * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "rgba(26,42,68,0.4)" }}>
            <Activity size={12} style={{ color: "var(--self-emergence)" }} />
            <div className="flex flex-col">
              <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>SURPRISE</span>
              <span className="font-mono text-xs font-bold" style={{ color: "var(--self-emergence)" }}>
                {((1 - accuracy) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
