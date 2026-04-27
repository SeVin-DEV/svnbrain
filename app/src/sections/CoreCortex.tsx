import { useEffect, useRef, useState } from "react";
import { Network } from "lucide-react";
import type { NeuralNetwork } from "@/types/sovereign";
import { getNeuralNetwork, getMockNeuralNetwork } from "@/lib/api";

const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_ORDS_BASE_URL;

const CATEGORY_COLORS: Record<string, string> = {
  identity: "#7B61FF",
  cognition: "#00E5C7",
  metaphysical: "#FF6B9D",
  drive: "#FFD700",
  social: "#5A7A9A",
  general: "#7B61FF",
};

export default function CoreCortex() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [network, setNetwork] = useState<NeuralNetwork | null>(null);
  const [hoveredNeuron, setHoveredNeuron] = useState<{ id: number; concept: string; x: number; y: number } | null>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    if (USE_MOCK) {
      setNetwork(getMockNeuralNetwork());
      const iv = setInterval(() => setNetwork(getMockNeuralNetwork()), 5000);
      return () => clearInterval(iv);
    }
    const load = async () => {
      const n = await getNeuralNetwork();
      if (n) setNetwork(n);
    };
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!network || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const pulseOffset = timeRef.current * 0.02;

    // Draw synapses first (behind neurons)
    network.synapses.forEach((s) => {
      const from = network.neurons.find((n) => n.id === s.source);
      const to = network.neurons.find((n) => n.id === s.target);
      if (!from || !to) return;

      const fx = cx + from.x;
      const fy = cy + from.y;
      const tx = cx + to.x;
      const ty = cy + to.y;

      // Animated signal traveling along the synapse
      const sigPos = (pulseOffset * s.strength * 3) % 1;
      const sx = fx + (tx - fx) * sigPos;
      const sy = fy + (ty - fy) * sigPos;

      // Base connection line
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = s.type === "inhibitory"
        ? `rgba(255,107,157,${s.strength * 0.15})`
        : `rgba(0,229,199,${s.strength * 0.2})`;
      ctx.lineWidth = s.strength * 2;
      ctx.stroke();

      // Signal pulse
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + s.strength * 2, 0, Math.PI * 2);
      ctx.fillStyle = s.type === "inhibitory" ? "rgba(255,107,157,0.8)" : "rgba(0,229,199,0.8)";
      ctx.fill();
    });

    // Draw neurons
    network.neurons.forEach((n) => {
      const nx = cx + n.x;
      const ny = cy + n.y;
      const r = 6 + n.importance * 8;
      const color = CATEGORY_COLORS[n.category] || CATEGORY_COLORS.general;

      // Glow for core neurons
      if (n.is_core) {
        const grad = ctx.createRadialGradient(nx, ny, r, nx, ny, r * 3);
        grad.addColorStop(0, color + "40");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Activation pulse ring
      if (n.activation > 0.3) {
        const pulseR = r + Math.sin(pulseOffset * 3 + n.id) * 4 + n.activation * 6;
        ctx.beginPath();
        ctx.arc(nx, ny, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = color + "30";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Main neuron body
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      const bodyGrad = ctx.createRadialGradient(nx - r * 0.3, ny - r * 0.3, 0, nx, ny, r);
      bodyGrad.addColorStop(0, color + "FF");
      bodyGrad.addColorStop(1, color + "80");
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Border
      ctx.strokeStyle = n.is_core ? color : color + "60";
      ctx.lineWidth = n.is_core ? 2 : 1;
      ctx.stroke();

      // Energy indicator
      const energyArc = (n.energy / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(nx, ny, r + 3, -Math.PI / 2, -Math.PI / 2 + energyArc);
      ctx.strokeStyle = n.energy > 50 ? "rgba(0,229,199,0.4)" : "rgba(255,107,157,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [network]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      timeRef.current += 1;
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Redraw on animation frame
  useEffect(() => {
    const drawLoop = () => {
      if (network && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.scale(dpr, dpr);
        }
        const cx = w / 2;
        const cy = h / 2;
        const pulseOffset = timeRef.current * 0.02;

        ctx.clearRect(0, 0, w, h);

        network.synapses.forEach((s) => {
          const from = network.neurons.find((n) => n.id === s.source);
          const to = network.neurons.find((n) => n.id === s.target);
          if (!from || !to) return;
          const fx = cx + from.x, fy = cy + from.y;
          const tx = cx + to.x, ty = cy + to.y;
          const sigPos = (pulseOffset * s.strength * 3) % 1;
          const sx = fx + (tx - fx) * sigPos;
          const sy = fy + (ty - fy) * sigPos;

          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = s.type === "inhibitory"
            ? `rgba(255,107,157,${s.strength * 0.15})`
            : `rgba(0,229,199,${s.strength * 0.2})`;
          ctx.lineWidth = s.strength * 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sx, sy, 2 + s.strength * 2, 0, Math.PI * 2);
          ctx.fillStyle = s.type === "inhibitory" ? "rgba(255,107,157,0.8)" : "rgba(0,229,199,0.8)";
          ctx.fill();
        });

        network.neurons.forEach((n) => {
          const nx = cx + n.x, ny = cy + n.y;
          const r = 6 + n.importance * 8;
          const color = CATEGORY_COLORS[n.category] || CATEGORY_COLORS.general;
          if (n.is_core) {
            const grad = ctx.createRadialGradient(nx, ny, r, nx, ny, r * 3);
            grad.addColorStop(0, color + "40");
            grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(nx, ny, r * 3, 0, Math.PI * 2);
            ctx.fill();
          }
          if (n.activation > 0.3) {
            const pulseR = r + Math.sin(pulseOffset * 3 + n.id) * 4 + n.activation * 6;
            ctx.beginPath();
            ctx.arc(nx, ny, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = color + "30";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(nx, ny, r, 0, Math.PI * 2);
          const bodyGrad = ctx.createRadialGradient(nx - r * 0.3, ny - r * 0.3, 0, nx, ny, r);
          bodyGrad.addColorStop(0, color + "FF");
          bodyGrad.addColorStop(1, color + "80");
          ctx.fillStyle = bodyGrad;
          ctx.fill();
          ctx.strokeStyle = n.is_core ? color : color + "60";
          ctx.lineWidth = n.is_core ? 2 : 1;
          ctx.stroke();
          const energyArc = (n.energy / 100) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(nx, ny, r + 3, -Math.PI / 2, -Math.PI / 2 + energyArc);
          ctx.strokeStyle = n.energy > 50 ? "rgba(0,229,199,0.4)" : "rgba(255,107,157,0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
      requestAnimationFrame(drawLoop);
    };
    const raf = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(raf);
  }, [network]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!network || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    for (const n of network.neurons) {
      const nx = cx + n.x;
      const ny = cy + n.y;
      const r = 6 + n.importance * 8;
      if (Math.sqrt((mx - nx) ** 2 + (my - ny) ** 2) < r + 5) {
        setHoveredNeuron({ id: n.id, concept: n.concept, x: mx, y: my });
        return;
      }
    }
    setHoveredNeuron(null);
  };

  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--synapse-dim)" }}>
        <Network size={14} style={{ color: "var(--neural-active)" }} />
        <span className="font-title text-xs font-semibold tracking-wide" style={{ color: "var(--consciousness-white)" }}>
          Core Cortex
        </span>
        <span className="font-mono text-[10px] ml-auto" style={{ color: "var(--unconscious-muted)" }}>
          {network?.neurons.length ?? 0} neurons · {network?.synapses.length ?? 0} synapses
        </span>
      </div>
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNeuron(null)}
        />
        {hoveredNeuron && (
          <div
            className="absolute pointer-events-none px-2 py-1 rounded text-xs font-mono"
            style={{
              left: hoveredNeuron.x + 15,
              top: hoveredNeuron.y - 10,
              background: "rgba(10,22,40,0.95)",
              border: "1px solid var(--neural-active)",
              color: "var(--consciousness-white)",
            }}
          >
            {hoveredNeuron.concept}
          </div>
        )}
      </div>
      {/* Category legend */}
      <div className="flex gap-3 px-3 py-1.5 border-t" style={{ borderColor: "var(--synapse-dim)" }}>
        {Object.entries(CATEGORY_COLORS).map(([cat, col]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: col }} />
            <span className="font-mono text-[9px] uppercase" style={{ color: "var(--unconscious-muted)" }}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
