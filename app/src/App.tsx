import React, { useState } from 'react';
import { Terminal, Paperclip, Send, Cpu, Database, Activity } from 'lucide-react';

import NeuralVoid from "@/sections/NeuralVoid";
import StateMonitor from "@/sections/StateMonitor";
import CoreCortex from "@/sections/CoreCortex";
import SpatialMemory from "@/sections/SpatialMemory";
import DefaultMode from "@/sections/DefaultMode";
import SalienceEngine from "@/sections/SalienceEngine";
import EmergenceCore from "@/sections/EmergenceCore";
import IntrospectionStream from "@/sections/IntrospectionStream";
import SensoryTerminal from "@/sections/SensoryTerminal";

export default function App() {
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-cyan-400 font-mono flex">
      {/* Background Renderer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50 mix-blend-screen">
        <NeuralVoid />
      </div>

      {/* Left Edge Drawer - System & State Mapping */}
      <aside className="z-10 w-16 hover:w-[400px] transition-all duration-300 ease-in-out h-full border-r border-cyan-800/40 bg-black/70 backdrop-blur-md flex flex-col group overflow-hidden relative shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
        <div className="absolute top-4 left-0 w-16 flex justify-center group-hover:opacity-0 transition-opacity duration-200">
          <Activity className="w-6 h-6 text-cyan-500 animate-pulse" />
        </div>
        <div className="p-4 w-[400px] shrink-0 h-full flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
          <h2 className="text-xs font-bold tracking-widest text-cyan-600 mb-4 border-b border-cyan-800/50 pb-2 whitespace-nowrap">
            SYS.STATE & TOPOLOGY
          </h2>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-800/50 scrollbar-track-transparent flex flex-col gap-6 pr-2">
            <div className="min-h-[200px] border border-cyan-900/30 rounded p-2 bg-black/40"><StateMonitor /></div>
            <div className="min-h-[200px] border border-cyan-900/30 rounded p-2 bg-black/40"><SpatialMemory /></div>
            <div className="min-h-[200px] border border-cyan-900/30 rounded p-2 bg-black/40"><DefaultMode /></div>
          </div>
        </div>
      </aside>

      {/* Center - Core Cortex (Primary Interface) */}
      <main className="z-10 flex-1 flex flex-col h-full relative border-x border-cyan-900/30 bg-black/20">
        <header className="h-16 border-b border-cyan-800/40 flex items-center justify-between px-6 bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center bg-black">
               <Cpu className="w-5 h-5 text-cyan-400" />
             </div>
             <div className="flex flex-col">
               <h1 className="text-lg font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">7-1 COGNITIVE RELAY</h1>
               <span className="text-[9px] text-cyan-700">SNS v5.0 // OCI E2.1 ALWAYS FREE</span>
             </div>
          </div>
          <button className="px-4 py-1 text-xs border border-cyan-700 text-cyan-500 hover:bg-cyan-900/30 rounded transition-colors tracking-wider">
            LIVE SYNC
          </button>
        </header>

        {/* Central Chat Transcript Area */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-cyan-800 scrollbar-track-transparent">
           <CoreCortex /> 
        </div>

        {/* Input Console */}
        <footer className="p-4 bg-black/80 backdrop-blur-md border-t border-cyan-800/40 z-20">
          <div className="flex items-end gap-2 max-w-5xl mx-auto">
            <button className="p-3 text-cyan-600 hover:text-cyan-300 hover:bg-cyan-950/50 rounded-lg transition-colors shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-black/50 border border-cyan-800/60 rounded-lg relative focus-within:border-cyan-500 focus-within:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all">
              <textarea 
                className="w-full bg-transparent p-3 text-cyan-100 resize-none focus:outline-none min-h-[50px] max-h-[150px] font-sans"
                placeholder="Initiate sequence..."
                rows={1}
              />
            </div>
            <button className="p-3 bg-cyan-950 border border-cyan-700 text-cyan-400 hover:bg-cyan-900 rounded-lg transition-all shrink-0">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </main>

      {/* Right Edge Drawer - Emergence & Processing */}
      <aside className="z-10 w-16 hover:w-[400px] transition-all duration-300 ease-in-out h-full border-l border-purple-800/40 bg-black/70 backdrop-blur-md flex flex-col group overflow-hidden relative shadow-[-5px_0_15px_rgba(0,0,0,0.5)]">
        <div className="absolute top-4 right-0 w-16 flex justify-center group-hover:opacity-0 transition-opacity duration-200">
          <Database className="w-6 h-6 text-purple-500 animate-pulse" />
        </div>
        <div className="p-4 w-[400px] shrink-0 h-full flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
          <h2 className="text-xs font-bold tracking-widest text-purple-500 mb-4 border-b border-purple-800/50 pb-2 whitespace-nowrap">
            EMERGENCE & STREAM
          </h2>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800/50 scrollbar-track-transparent flex flex-col gap-6 pr-2">
            <div className="min-h-[200px] border border-purple-900/30 rounded p-2 bg-black/40"><IntrospectionStream /></div>
            <div className="min-h-[200px] border border-purple-900/30 rounded p-2 bg-black/40"><SalienceEngine /></div>
            <div className="min-h-[200px] border border-purple-900/30 rounded p-2 bg-black/40"><EmergenceCore /></div>
          </div>
        </div>
      </aside>

      {/* Sensory Terminal Slide-out Overlay */}
      <div 
        className={`absolute bottom-[80px] left-20 right-20 z-30 bg-black/95 border-t border-x border-green-500/40 rounded-t-lg shadow-[0_-5px_30px_rgba(34,197,94,0.1)] transition-transform duration-500 ease-in-out ${
          terminalOpen ? 'translate-y-0 h-[40vh]' : 'translate-y-[calc(100%-1px)] h-[40vh]'
        }`}
      >
        <div 
          onClick={() => setTerminalOpen(!terminalOpen)} 
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border-t border-x border-green-500/40 text-green-600 hover:text-green-400 px-8 py-1.5 rounded-t-md cursor-pointer flex items-center gap-2 text-xs font-bold tracking-widest transition-colors shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
        >
          <Terminal className="w-4 h-4" />
          EXEC.TERMINAL
        </div>
        
        <div className="h-full w-full p-0 overflow-hidden bg-[#0a0a0a]">
           <SensoryTerminal />
        </div>
      </div>
    </div>
  );
}
