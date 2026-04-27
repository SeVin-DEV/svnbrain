import { useEffect, useRef, useState } from "react";
import { Box } from "lucide-react";
import type { SpatialData } from "@/types/sovereign";
import { getSpatialMemory, getMockSpatialData } from "@/lib/api";

const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_ORDS_BASE_URL;

const EMOTION_COLORS: Record<string, string> = {
  wonder: "#7B61FF",
  joy: "#00E5C7",
  curiosity: "#FFD700",
  contentment: "#5A7A9A",
  surprise: "#FF6B9D",
};

export default function SpatialMemory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<SpatialData | null>(null);
  const [rotation, setRotation] = useState({ x: 0.3, y: 0 });
  const [hovered, setHovered] = useState<{ content: string; x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const animRef = useRef(0);

  useEffect(() => {
    if (USE_MOCK) {
      setData(getMockSpatialData());
      const iv = setInterval(() => setData(getMockSpatialData()), 6000);
      return () => clearInterval(iv);
    }
    const load = async () => {
      const d = await getSpatialMemory();
      if (d) setData(d);
    };
    load();
    const iv = setInterval(load, 4000);
    return () => clearInterval(iv);
  }, []);

  // Auto-rotate when not dragging
  useEffect(() => {
    let autoRotate = true;
    const tick = () => {
      if (autoRotate && !isDragging.current) {
        setRotation((r) => ({ x: r.x, y: r.y + 0.002 }));
      }
      animRef.current = requestAnimationFrame(tick);
    };
    tick();

    const onDown = () => { autoRotate = false; isDragging.current = true; };
    const onUp = () => { isDragging.current = false; setTimeout(() => { autoRotate = true; }, 3000); };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
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

    const cx = w / 2;
    const cy = h / 2;
    const fov = 300;

    // Sort memories by depth for proper z-ordering
    const sorted = [...data.memories].sort((a, b) => {
      const az = a.z * Math.cos(rotation.x) - a.y * Math.sin(rotation.x);
      const bz = b.z * Math.cos(rotation.x) - b.y * Math.sin(rotation.x);
      return bz - az;
    });

    // Draw memory palace wireframe (room boundaries)
    ctx.strokeStyle = "rgba(26, 42, 68, 0.3)";
    ctx.lineWidth = 0.5;
    const roomSize = 80;
    const corners = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ];
    const projected = corners.map(([x, y, z]) => {
      const rx = x * roomSize;
      const ry = y * roomSize * Math.cos(rotation.x) - z * roomSize * Math.sin(rotation.x);
      const rz = y * roomSize * Math.sin(rotation.x) + z * roomSize * Math.cos(rotation.x);
      const rrx = rx * Math.cos(rotation.y) + rz * Math.sin(rotation.y);
      const rrz = -rx * Math.sin(rotation.y) + rz * Math.cos(rotation.y);
      const scale = fov / (fov + rrz);
      return { x: cx + rrx * scale, y: cy + ry * scale, scale, z: rrz };
    });

    // Draw cube edges
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    edges.forEach(([a, b]) => {
      if (projected[a].z > -200 && projected[b].z > -200) {
        ctx.beginPath();
        ctx.moveTo(projected[a].x, projected[a].y);
        ctx.lineTo(projected[b].x, projected[b].y);
        ctx.stroke();
      }
    });

    // Draw memory objects
    sorted.forEach((mem) => {
      const ry = mem.y * Math.cos(rotation.x) - mem.z * Math.sin(rotation.x);
      const rz = mem.y * Math.sin(rotation.x) + mem.z * Math.cos(rotation.x);
      const rx = mem.x * Math.cos(rotation.y) + rz * Math.sin(rotation.y);
      const rrz = -mem.x * Math.sin(rotation.y) + rz * Math.cos(rotation.y);

      if (rrz < -fov + 50) return;

      const scale = fov / (fov + rrz);
      const sx = cx + rx * scale * 1.5;
      const sy = cy + ry * scale * 1.5;
      const size = (4 + mem.strength * 8) * scale;
      const alpha = Math.max(0.15, mem.recency * mem.strength * scale);
      const tag = mem.emotional_tone?.tag || "neutral";
      const color = EMOTION_COLORS[tag] || "#7B61FF";

      // Glow
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 4);
      glow.addColorStop(0, color + Math.round(alpha * 40).toString(16).padStart(2, "0"));
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(sx - size * 4, sy - size * 4, size * 8, size * 8);

      // Shape based on strength
      ctx.beginPath();
      if (mem.strength > 0.8) {
        // Dodecahedron-like (circle with inner detail)
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(alpha * 200).toString(16).padStart(2, "0");
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + alpha * 0.5 + ")";
        ctx.fill();
      } else if (mem.strength > 0.5) {
        // Tetrahedron-like (triangle)
        ctx.moveTo(sx, sy - size);
        ctx.lineTo(sx + size * 0.866, sy + size * 0.5);
        ctx.lineTo(sx - size * 0.866, sy + size * 0.5);
        ctx.closePath();
        ctx.fillStyle = color + Math.round(alpha * 180).toString(16).padStart(2, "0");
        ctx.fill();
      } else {
        // Simple point
        ctx.arc(sx, sy, size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(alpha * 120).toString(16).padStart(2, "0");
        ctx.fill();
      }

    });
  }, [data, rotation]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    if (isDragging.current) {
      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;
      setRotation((r) => ({ x: Math.max(-0.5, Math.min(0.5, r.x + dy * 0.005)), y: r.y + dx * 0.005 }));
    }
    lastPos.current = { x, y };

    // Check for hover
    if (!data) return;
    const cx = canvasRect.width / 2;
    const cy = canvasRect.height / 2;
    const fov = 300;

    for (const mem of data.memories) {
      const ry = mem.y * Math.cos(rotation.x) - mem.z * Math.sin(rotation.x);
      const rz = mem.y * Math.sin(rotation.x) + mem.z * Math.cos(rotation.x);
      const rx = mem.x * Math.cos(rotation.y) + rz * Math.sin(rotation.y);
      const rrz = -mem.x * Math.sin(rotation.y) + rz * Math.cos(rotation.y);
      if (rrz < -fov + 50) continue;
      const scale = fov / (fov + rrz);
      const sx = cx + rx * scale * 1.5;
      const sy = cy + ry * scale * 1.5;
      const size = (4 + mem.strength * 8) * scale;
      if (Math.sqrt((x - sx) ** 2 + (y - sy) ** 2) < size + 5) {
        setHovered({ content: mem.content, x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top });
        return;
      }
    }
    setHovered(null);
  };

  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--synapse-dim)" }}>
        <Box size={14} style={{ color: "var(--neural-pulse)" }} />
        <span className="font-title text-xs font-semibold tracking-wide" style={{ color: "var(--consciousness-white)" }}>
          Spatial Memory
        </span>
        <span className="font-mono text-[10px] ml-auto" style={{ color: "var(--unconscious-muted)" }}>
          {data?.memories.length ?? 0} memories · {data?.palaces[0]?.name ?? "The Atrium"}
        </span>
      </div>
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-move"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHovered(null); isDragging.current = false; }}
        />
        {hovered && (
          <div
            className="absolute pointer-events-none px-2 py-1 rounded text-xs font-mono max-w-[200px]"
            style={{
              left: Math.min(hovered.x + 15, 180),
              top: hovered.y - 10,
              background: "rgba(10,22,40,0.95)",
              border: "1px solid var(--neural-pulse)",
              color: "var(--consciousness-white)",
            }}
          >
            {hovered.content}
          </div>
        )}
      </div>
    </div>
  );
}
