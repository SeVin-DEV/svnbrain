import { useEffect, useState } from "react";
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
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    window.innerHeight > window.innerWidth ? "portrait" : "landscape"
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape");
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const isPortrait = orientation === "portrait";

  return (
    <>
      <div className="svnai-bg">
        <NeuralVoid />
      </div>
      <div className="svnai-content">
        {isPortrait ? (
          <div className="svnai-grid-portrait">
            <div className="svnai-row">
              <div className="svnai-cell"><CoreCortex /></div>
              <div className="svnai-cell"><DefaultMode /></div>
              <div className="svnai-cell"><SalienceEngine /></div>
            </div>
            <div className="svnai-row svnai-row-large">
              <div className="svnai-cell svnai-cell-wide"><SensoryTerminal /></div>
            </div>
            <div className="svnai-row">
              <div className="svnai-cell"><SpatialMemory /></div>
              <div className="svnai-cell"><EmergenceCore /></div>
              <div className="svnai-cell"><IntrospectionStream /></div>
            </div>
            <div className="svnai-row svnai-row-small">
              <div className="svnai-cell svnai-cell-wide"><StateMonitor /></div>
            </div>
          </div>
        ) : (
          <div className="svnai-grid-landscape">
            <div className="svnai-row">
              <div className="svnai-cell"><CoreCortex /></div>
              <div className="svnai-cell svnai-cell-large"><SensoryTerminal /></div>
              <div className="svnai-cell"><SalienceEngine /></div>
              <div className="svnai-cell svnai-cell-tall"><StateMonitor /></div>
            </div>
            <div className="svnai-row">
              <div className="svnai-cell"><SpatialMemory /></div>
              <div className="svnai-cell"><DefaultMode /></div>
              <div className="svnai-cell"><EmergenceCore /></div>
              <div className="svnai-cell"><IntrospectionStream /></div>
            </div>
            <div className="svnai-footer">
              <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>
                SNS v5.0 — Oracle 26ai Always Free
              </span>
              <span className="font-mono text-[9px]" style={{ color: "var(--unconscious-muted)" }}>
                Synthetic cognition, not artificial intelligence
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
