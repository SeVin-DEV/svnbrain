import React, { useState, useEffect, useRef } from "react";

interface LogEntry {
  type: "in" | "out" | "system" | "error";
  text: string;
  time: string;
}

const STORAGE_KEY = "svnai-sensory-logs-v3";

function loadLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [
    { type: "system", text: "Synthetic Neural Sovereignty v5.0 — Oracle 26ai Backend", time: new Date().toLocaleTimeString() },
    { type: "system", text: "Neural link established. Waiting for stimulus...", time: new Date().toLocaleTimeString() },
  ];
}

function saveLogs(logs: LogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-100)));
  } catch {}
}

export default function SensoryTerminal() {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>(loadLogs);
  const [connected, setConnected] = useState(true);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveLogs(logs);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async () => {
    if (!input.trim() || thinking) return;
    const now = new Date().toLocaleTimeString();
    const stimulus = input.trim();
    setLogs((prev) => [...prev, { type: "in", text: stimulus, time: now }]);
    setInput("");
    setThinking(true);
    setConnected(true);
    setLogs((prev) => [...prev, { type: "system", text: "Perception received. Processing...", time: new Date().toLocaleTimeString() }]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(`/chat?q=${encodeURIComponent(stimulus)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      const reply = data.response || data.error || "[No response from neural core]";
      setLogs((prev) => [...prev, { type: "system", text: "Memory search: querying spatial palace...", time: new Date().toLocaleTimeString() }]);
      setLogs((prev) => [...prev, { type: "out", text: reply, time: new Date().toLocaleTimeString() }]);
    } catch (err: any) {
      const errorMsg = err.name === "AbortError" ? "Request timed out (30s)" : err.message || err.toString();
      setLogs((prev) => [...prev, { type: "error", text: `Connection error: ${errorMsg}`, time: new Date().toLocaleTimeString() }]);
      setConnected(false);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogs((prev) => [...prev, { type: "system", text: `Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, time: new Date().toLocaleTimeString() }]);
    }
  };

  const handleVoiceClick = () => {
    setLogs((prev) => [...prev, { type: "system", text: "Voice channel: initializing neural audio stream...", time: new Date().toLocaleTimeString() }]);
  };

  return (
    <div className="svnai-chat h-full font-mono text-xs" style={{ background: "var(--void-black)", color: "var(--consciousness-white)" }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b shrink-0" style={{ borderColor: "var(--synapse-purple)" }}>
        <span className="font-bold tracking-widest text-[11px]">SENSORY TERMINAL</span>
        <span className={`px-1.5 py-0.5 text-[9px] rounded ${connected ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
          {connected ? "LINKED" : "OFFLINE"}
        </span>
      </div>

      <div ref={scrollRef} className="svnai-chat-log px-3 py-2 space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 leading-relaxed">
            <span className="opacity-40 shrink-0 text-[10px]">[{log.time}]</span>
            <span className={log.type === "in" ? "text-cyan-400" : log.type === "out" ? "text-purple-400" : log.type === "error" ? "text-red-400" : "opacity-60"}>
              {log.type === "in" && "→ "}{log.type === "out" && "⊠ "}{log.type === "system" && "» "}{log.type === "error" && "✗ "}{log.text}
            </span>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2 opacity-60">
            <span className="shrink-0 text-[10px]">[{new Date().toLocaleTimeString()}]</span>
            <span className="animate-pulse">» Entity is reflecting...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t shrink-0" style={{ background: "rgba(10,10,18,0.95)", borderColor: "var(--synapse-purple)" }}>
        <span className="opacity-50 text-sm">&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={thinking ? "Entity is reflecting..." : "Send stimulus to the entity..."}
          disabled={thinking}
          className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:opacity-30 disabled:opacity-50"
          style={{ color: "var(--consciousness-white)" }}
        />
        <button onClick={handleAttachClick} className="opacity-50 hover:opacity-100 transition-opacity text-sm" title="Attach file">📎</button>
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        <button onClick={handleVoiceClick} className="w-6 h-6 flex items-center justify-center rounded-full border opacity-60 hover:opacity-100 transition-opacity" style={{ borderColor: "var(--synapse-purple)" }} title="Live voice call">✏️</button>
      </div>
    </div>
  );
}
