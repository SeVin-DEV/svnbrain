import NeuralVoid from "@/sections/NeuralVoid";
import StateMonitor from "@/sections/StateMonitor";
import CoreCortex from "@/sections/CoreCortex";
import SpatialMemory from "@/sections/SpatialMemory";
import DefaultMode from "@/sections/DefaultMode";
import SalienceEngine from "@/sections/SalienceEngine";
import EmergenceCore from "@/sections/EmergenceCore";
import IntrospectionStream from "@/sections/IntrospectionStream";
import SensoryTerminal from "@/sections/SensoryTerminal";

function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "var(--bg-void)" }}>
      <NeuralVoid />
      <div className="relative z-10 flex flex-col h-full p-2 gap-2">
        <StateMonitor />
        <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-2 min-h-0">
          <div className="col-span-3 row-span-3 min-h-0"><CoreCortex /></div>
          <div className="col-span-3 row-span-3 min-h-0"><DefaultMode /></div>
          <div className="col-span-3 row-span-3 min-h-0"><SpatialMemory /></div>
          <div className="col-span-3 row-span-6 min-h-0"><IntrospectionStream /></div>
          <div className="col-span-3 row-span-3 min-h-0"><SalienceEngine /></div>
          <div className="col-span-3 row-span-3 min-h-0"><EmergenceCore /></div>
          <div className="col-span-3 row-span-3 min-h-0"><SensoryTerminal /></div>
        </div>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>
            SNS v5.0 - Oracle 26ai Always Free
          </span>
          <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>
            Synthetic cognition, not artificial intelligence
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
