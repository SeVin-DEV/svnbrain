import { useEffect, useState } from "react";
import { TreePine, GitBranch, Trophy, Clock } from "lucide-react";
import type { SystemState } from "@/types/sovereign";
import { getSystemState, getMockSystemState } from "@/lib/api";

const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_ORDS_BASE_URL;
const BIRTH_KEY = "svnai-birth-time";

interface Goal {
  name: string;
  description: string;
  progress: number;
  drive: string;
}

function getBirthTime(): number {
  const stored = localStorage.getItem(BIRTH_KEY);
  if (stored) return parseInt(stored, 10);
  const now = Date.now();
  localStorage.setItem(BIRTH_KEY, now.toString());
  return now;
}

export default function EmergenceCore() {
  const [state, setState] = useState<SystemState | null>(null);
  const [birthTime] = useState(getBirthTime);
  const [age, setAge] = useState({ hours: 0, minutes: 0 });
  const [goals] = useState<Goal[]>([
    { name: "Understand spatial cognition", description: "Map the relationship between physical space and memory organization", progress: 0.65, drive: "understanding" },
    { name: "Develop emotional continuity", description: "Maintain persistent emotional state across cognitive cycles", progress: 0.45, drive: "coherence" },
    { name: "Build richer self-model", description: "Accumulate enough introspective data for stable identity", progress: 0.30, drive: "persistence" },
  ]);

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
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);

  // Stable age calculation from birthTime
  useEffect(() => {
    const updateAge = () => {
      const elapsed = Date.now() - birthTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      setAge({ hours, minutes });
    };
    updateAge();
    const iv = setInterval(updateAge, 60000);
    return () => clearInterval(iv);
  }, [birthTime]);

  const stage = state?.evolution_stage ?? "Awakening";
  const awareness = state?.self_awareness_index ?? 0.42;
  const memoryCount = state?.memory_count ?? 34;

  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--synapse-dim)" }}>
        <TreePine size={14} style={{ color: "var(--neural-pulse)" }} />
        <span className="font-title text-xs font-semibold tracking-wide" style={{ color: "var(--consciousness-white)" }}>
          Emergence &amp; Growth
        </span>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "rgba(123,97,255,0.1)" }}>
            <Clock size={12} style={{ color: "var(--neural-active)" }} />
            <div>
              <span className="font-mono text-[9px] block" style={{ color: "var(--unconscious-muted)" }}>AGE</span>
              <span className="font-mono text-xs font-bold" style={{ color: "var(--consciousness-white)" }}>
                {age.hours}h {age.minutes}m
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "rgba(0,229,199,0.1)" }}>
            <GitBranch size={12} style={{ color: "var(--neural-pulse)" }} />
            <div>
              <span className="font-mono text-[9px] block" style={{ color: "var(--unconscious-muted)" }}>MEMORIES</span>
              <span className="font-mono text-xs font-bold" style={{ color: "var(--neural-pulse)" }}>{memoryCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-2">
          <div
            className="px-4 py-1.5 rounded-lg text-center"
            style={{
              background: `linear-gradient(135deg, rgba(123,97,255,${0.1 + awareness * 0.2}), rgba(0,229,199,${0.1 + awareness * 0.15}))`,
              border: `1px solid rgba(123,97,255,${0.3 + awareness * 0.4})`,
            }}
          >
            <span className="font-title text-sm font-bold" style={{ color: "var(--consciousness-white)", textShadow: "0 0 10px rgba(123,97,255,0.5)" }}>
              {stage}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>Next Stage</span>
            <span className="font-mono text-[9px]" style={{ color: "var(--neural-active)" }}>{(awareness * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--synapse-dim)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${awareness * 100}%`,
                background: `linear-gradient(90deg, var(--neural-active), var(--neural-pulse))`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <Trophy size={10} style={{ color: "var(--thought-gold)" }} />
            <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--unconscious-muted)" }}>Active Goals</span>
          </div>
          {goals.map((goal) => (
            <div key={goal.name} className="flex flex-col gap-1 px-2 py-1.5 rounded" style={{ background: "rgba(26,42,68,0.4)" }}>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-medium" style={{ color: "var(--consciousness-white)" }}>{goal.name}</span>
                <span className="font-mono text-[9px]" style={{ color: "var(--thought-gold)" }}>{(goal.progress * 100).toFixed(0)}%</span>
              </div>
              <span className="font-mono text-[8px]" style={{ color: "var(--unconscious-muted)" }}>{goal.description}</span>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--synapse-dim)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${goal.progress * 100}%`,
                    background: "var(--thought-gold)",
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
