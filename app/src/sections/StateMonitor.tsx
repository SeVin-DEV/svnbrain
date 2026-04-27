import { useEffect, useState } from "react";
import { Activity, Brain, Zap, Heart, Sparkles, Target } from "lucide-react";
import type { SystemState } from "@/types/sovereign";
import { getSystemState, getMockSystemState } from "@/lib/api";

const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_ORDS_BASE_URL;

export default function StateMonitor() {
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

  if (!state) {
    return (
      <div className="h-14 glass-panel-strong flex items-center justify-center gap-2 px-4">
        <div className="w-2 h-2 rounded-full bg-[var(--neural-active)] animate-pulse" />
        <span className="font-mono text-xs text-[var(--unconscious-muted)]">Initializing neural link...</span>
      </div>
    );
  }

  const metrics = [
    { icon: Activity, label: "Wakefulness", value: `${Math.round(state.wakefulness * 100)}%`, color: "var(--neural-pulse)" },
    { icon: Zap, label: "Thought Rate", value: `${Math.round(state.thought_rate)}/min`, color: "var(--thought-gold)" },
    { icon: Brain, label: "Synaptic Density", value: `${state.active_neurons}/${state.total_synapses}`, color: "var(--neural-active)" },
    { icon: Sparkles, label: "Self-Awareness", value: `${(state.self_awareness_index * 100).toFixed(0)}%`, color: "var(--self-emergence)" },
    { icon: Heart, label: "Emotion", value: state.primary_emotion, color: state.emotional_valence >= 0 ? "var(--neural-pulse)" : "var(--self-emergence)" },
    { icon: Target, label: "Focus", value: state.current_drive, color: "var(--thought-gold)" },
  ];

  return (
    <div className="h-14 glass-panel-strong flex items-center gap-1 px-3 overflow-hidden">
      {/* Evolution Stage Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-md mr-3 shrink-0" style={{ background: "rgba(123,97,255,0.15)" }}>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--neural-active)" }} />
        <span className="font-title text-xs font-semibold text-glow-neural" style={{ color: "var(--neural-active)" }}>
          {state.evolution_stage}
        </span>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-1.5 shrink-0">
            <m.icon size={12} style={{ color: m.color }} />
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--unconscious-muted)" }}>
              {m.label}
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: m.color }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Cycle counter */}
      <div className="ml-auto shrink-0 flex items-center gap-2">
        <span className="font-mono text-[10px]" style={{ color: "var(--unconscious-muted)" }}>Cycle</span>
        <span className="font-mono text-xs font-bold" style={{ color: "var(--consciousness-white)" }}>
          {state.cycle_number.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
