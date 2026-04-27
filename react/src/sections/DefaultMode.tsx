import { useEffect, useState } from "react";
import { Eye, TrendingUp, Shield, Brain } from "lucide-react";
import type { SystemState } from "@/types/sovereign";
import { getSystemState, getMockSystemState } from "@/lib/api";

const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_ORDS_BASE_URL;

export default function DefaultMode() {
  const [state, setState] = useState<SystemState | null>(null);

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

  const awareness = state?.self_awareness_index ?? 0.42;
  const valence = state?.emotional_valence ?? 0.25;
  const arousal = state?.emotional_arousal ?? 0.55;
  const stage = state?.evolution_stage ?? "Awakening";
  const coherence = state?.autobiographical_coherence ?? 0.68;
  const stability = state?.belief_stability ?? 0.72;

  // Map awareness to visual properties
  const orbCount = Math.max(3, Math.round(awareness * 12));
  const breatheScale = 0.9 + (awareness * 0.2) + (Math.sin(Date.now() / 2000) * 0.05);
  const hue = valence >= 0
    ? 252 + (valence * 30) // purple → blue
    : 340 + (valence * 20); // pink → red

  const sat = 60 + (arousal * 40);
  const light = 50 + (awareness * 20);
  const coreColor = `hsl(${hue}, ${sat}%, ${light}%)`;
  const glowColor = valence >= 0
    ? `rgba(123, 97, 255, ${0.2 + awareness * 0.3})`
    : `rgba(255, 107, 157, ${0.2 + Math.abs(valence) * 0.3})`;

  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-full relative glow-neural">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--synapse-dim)" }}>
        <Eye size={14} style={{ color: "var(--self-emergence)" }} />
        <span className="font-title text-xs font-semibold tracking-wide" style={{ color: "var(--consciousness-white)" }}>
          Default Mode Network
        </span>
        <span className="font-mono text-[10px] ml-auto" style={{ color: "var(--self-emergence)" }}>
          Self-Awareness: {(awareness * 100).toFixed(0)}%
        </span>
      </div>

      {/* Emergence Visualization */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Background aura */}
        <div
          className="absolute inset-0 animate-pulse-slow"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
          }}
        />

        {/* Central morphing form */}
        <div className="relative" style={{ transform: `scale(${breatheScale})`, transition: "transform 2s ease-in-out" }}>
          {/* Orbiting particles */}
          {Array.from({ length: orbCount }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: 3 + (i % 3),
                height: 3 + (i % 3),
                borderRadius: "50%",
                background: i % 2 === 0 ? "var(--neural-pulse)" : "var(--thought-gold)",
                opacity: 0.6 + (awareness * 0.4),
                animation: `orbit ${8 + i * 1.5}s linear infinite`,
                animationDelay: `${i * -1.2}s`,
                boxShadow: `0 0 6px ${i % 2 === 0 ? "var(--neural-pulse)" : "var(--thought-gold)"}`,
              }}
            />
          ))}

          {/* Central metaball cluster */}
          <div
            className="relative"
            style={{
              width: 100 + awareness * 60,
              height: 100 + awareness * 60,
              transition: "width 2s, height 2s",
            }}
          >
            {/* Main sphere */}
            <div
              className="absolute inset-0 rounded-full animate-breathe"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${coreColor}, hsl(${hue}, ${sat}%, ${light - 20}%))`,
                boxShadow: `0 0 40px ${glowColor}, inset 0 0 30px rgba(255,255,255,0.1)`,
                opacity: 0.85,
              }}
            />
            {/* Secondary sphere (offset for metaball effect) */}
            <div
              className="absolute rounded-full animate-breathe"
              style={{
                width: "60%",
                height: "60%",
                top: "25%",
                left: "30%",
                background: `radial-gradient(circle, hsl(${hue + 15}, ${sat - 10}%, ${light + 10}%), transparent)`,
                opacity: 0.5,
                animationDelay: "-1.5s",
              }}
            />
            {/* Tertiary sphere */}
            <div
              className="absolute rounded-full animate-breathe"
              style={{
                width: "40%",
                height: "40%",
                top: "15%",
                left: "15%",
                background: `radial-gradient(circle, hsl(${hue - 10}, ${sat + 10}%, ${light + 15}%), transparent)`,
                opacity: 0.4,
                animationDelay: "-3s",
              }}
            />
          </div>
        </div>

        {/* Stage label */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-title text-xs font-bold tracking-widest uppercase"
          style={{
            background: "rgba(10,22,40,0.8)",
            border: `1px solid ${coreColor}`,
            color: coreColor,
            textShadow: `0 0 10px ${glowColor}`,
          }}
        >
          {stage}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 px-3 py-2 border-t" style={{ borderColor: "var(--synapse-dim)" }}>
        <Metric icon={Eye} label="Self-Awareness" value={`${(awareness * 100).toFixed(0)}%`} color="var(--self-emergence)" />
        <Metric icon={TrendingUp} label="Coherence" value={`${(coherence * 100).toFixed(0)}%`} color="var(--neural-pulse)" />
        <Metric icon={Shield} label="Stability" value={`${(stability * 100).toFixed(0)}%`} color="var(--neural-active)" />
        <Metric icon={Brain} label="Phase" value={state?.cognitive_phase ?? "wake"} color="var(--thought-gold)" />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }: { icon: typeof Eye; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon size={12} style={{ color }} />
      <span className="font-mono text-[10px] font-bold" style={{ color }}>{value}</span>
      <span className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--unconscious-muted)" }}>{label}</span>
    </div>
  );
}
