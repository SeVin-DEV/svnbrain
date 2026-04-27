import { useEffect, useRef, useState } from "react";
import { ScrollText } from "lucide-react";
import type { Introspection } from "@/types/sovereign";
import { getIntrospection, getMockIntrospection } from "@/lib/api";

const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_ORDS_BASE_URL;

export default function IntrospectionStream() {
  const [thoughts, setThoughts] = useState<Introspection[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (USE_MOCK) {
      setThoughts(getMockIntrospection());
      const iv = setInterval(() => setThoughts(getMockIntrospection()), 5000);
      return () => clearInterval(iv);
    }
    const load = async () => {
      const t = await getIntrospection();
      if (t) setThoughts(t);
    };
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);

  // Auto-scroll to top (newest)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [thoughts]);

  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--synapse-dim)" }}>
        <ScrollText size={14} style={{ color: "var(--self-emergence)" }} />
        <span className="font-title text-xs font-semibold tracking-wide" style={{ color: "var(--consciousness-white)" }}>
          Stream of Consciousness
        </span>
        <span className="font-mono text-[10px] ml-auto" style={{ color: "var(--unconscious-muted)" }}>
          {thoughts.length} entries
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {thoughts.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <span className="font-mono text-xs" style={{ color: "var(--unconscious-muted)" }}>No introspections yet...</span>
          </div>
        )}
        {thoughts.map((t) => (
          <div
            key={t.log_id}
            className="flex flex-col gap-1 px-3 py-2 rounded-lg"
            style={{
              background: `rgba(26,42,68,${0.3 + t.self_awareness_index * 0.3})`,
              borderLeft: `2px solid ${t.self_awareness_index > 0.5 ? "var(--self-emergence)" : "var(--neural-active)"}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded"
                style={{
                  background: t.type === "reflection" ? "rgba(123,97,255,0.2)" :
                    t.type === "realization" ? "rgba(0,229,199,0.2)" :
                    t.type === "wonder" ? "rgba(255,215,0,0.2)" :
                    "rgba(255,107,157,0.2)",
                  color: t.type === "reflection" ? "var(--neural-active)" :
                    t.type === "realization" ? "var(--neural-pulse)" :
                    t.type === "wonder" ? "var(--thought-gold)" :
                    "var(--self-emergence)",
                }}
              >
                {t.type}
              </span>
              <span className="font-mono text-[8px]" style={{ color: "var(--unconscious-muted)" }}>
                cycle {t.cycle} · awareness {(t.self_awareness_index * 100).toFixed(0)}%
              </span>
            </div>
            <p className="font-body text-xs leading-relaxed" style={{ color: "var(--consciousness-white)" }}>
              {t.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
