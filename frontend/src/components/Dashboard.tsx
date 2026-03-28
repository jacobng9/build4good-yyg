"use client";

import { useHealthData } from "@/hooks/useHealthData";
import HeartRateChart from "./HeartRateChart";
import HRVChart from "./HRVChart";
import SpaceReadinessGauge from "./SpaceReadinessGauge";
import AtmosphericSidebar from "./AtmosphericSidebar";
import GravityToggle from "./GravityToggle";
import StatusIndicator from "./StatusIndicator";
import TiltCard from "./TiltCard";

export default function Dashboard() {
  const { current, history, isConnected, gravityMode, toggleGravity } = useHealthData();

  return (
    <div className="dashboard-grid relative z-10">
      {/* Main Content Area */}
      <div className="main-content">
        {/* Top gauge area */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-2 h-[300px]">
          <SpaceReadinessGauge score={current?.readiness_score ?? 0} />
          
          <div className="flex flex-col gap-4">
             <GravityToggle gravityMode={gravityMode} onToggle={toggleGravity} />
          </div>
        </div>

        {/* Charts row */}
        <div className="charts-row">
          <HeartRateChart history={history} current={current} />
          <HRVChart history={history} current={current} />
        </div>
      </div>

      {/* Sidebar Area */}
      <div className="sidebar-area">
        <TiltCard className="p-0 flex-1 flex flex-col min-h-0">
          <AtmosphericSidebar data={current?.atmospheric ?? null} gravityMode={gravityMode} />
        </TiltCard>
        
        {/* FFT Snapshot for nerds */}
        <TiltCard className="p-4 flex flex-col h-[150px]">
          <div className="flex justify-between items-center mb-2">
            <span className="section-label mb-0">RAW FFT MAGNITUDE</span>
          </div>
          <div className="flex-1 flex items-end gap-[1px]">
             {current?.fft ? (
               current.fft.map((f, i) => (
                 <div
                   key={i}
                   className="flex-1 bg-cyan-500/30 rounded-t-sm"
                   style={{
                     height: `${Math.min(100, (f.magnitude / 0.5) * 100)}%`,
                     transition: "height 0.2s ease",
                   }}
                 />
               ))
             ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-slate-500 font-mono">NO DATA</span>
                </div>
             )}
          </div>
        </TiltCard>
      </div>
      
      {/* Bottom Status Bar */}
      <div className="col-span-full">
         <StatusIndicator isConnected={isConnected} bpm={current?.bpm ?? 0} gravityMode={gravityMode} />
      </div>
    </div>
  );
}
