import React, { useState, useEffect, useRef } from "react";

export default function SensoryTerminal() {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState([
    { type: "system", text: "Synthetic Neural Sovereignty v5.0 — Oracle 26ai Backend", time: new Date().toLocaleTimeString() },
    { type: "system", text: "Neural link established. Waiting for stimulus...", time: new Date().toLocaleTimeString() },
  ]);
  const [connected, setConnected] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const now = new Date().toLocaleTimeString();
    const stimulus = input.trim();
    setLogs((prev) => [...prev, { type: "in", text: stimulus, time: now }]);
    setInput("");

    setLogs((prev) => [...prev, { type: "system", text: "Perception received. Processing...", time: new Date().toLocaleTimeString() }]);

    try {
      const response = await fetch(`/chat?q=${encodeURIComponent(stimulus)}`);
      const data = await response.json();

      setLogs((prev) => [...prev, { type: "system", text: "Memory search: querying spatial palace...", time: new Date().toLocaleTimeString() }]);

      setTimeout(() => {
        const reply = data.response || data.error || "[No response from neural core]";
        setLogs((prev) => [...prev, { type: "out", text: reply, time: new Date().toLocaleTimeString() }]);
      }, 600);
    } catch (err: any) {
      setLogs((prev) => [...prev, { type: "system", text: `Connection error: ${err.message || err}`, time: new Date().toLocaleTimeString() }]);
      setConnected(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="h-full flex flex-col font-mono text-xs p-4" style={{ background: "var(--void-black)", color: "var(--consciousness-white)" }}>
      <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: "var(--synapse-purple)" }}>
        <span className="font-bold tracking-widest">SENSORY TERMINAL</span>
        <span className={`px-2 py-0.5 text-[10px] ${connected ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
          {connected ? "LINKED" : "OFFLINE"}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 mb-3 pr-1" style={{ maxHeight: "calc(100% - 60px)" }}>
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="opacity-40 shrink-0">[{log.time}]</span>
            <span className={log.type === "in" ? "text-cyan-400" : log.type === "out" ? "text-purple-400" : "opacity-60"}>
              {log.type === "in" && "→ "}
              {log.type === "out" && "← "}
              {log.type === "system" && "· "}
              {log.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t pt-2" style={{ borderColor: "var(--synapse-purple)" }}>
        <span className="opacity-50">&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send stimulus to the entity..."
          className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:opacity-30"
          style={{ color: "var(--consciousness-white)" }}
        />
      </div>
    </div>
  );
}
