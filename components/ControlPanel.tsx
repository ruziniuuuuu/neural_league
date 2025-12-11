import React from 'react';

interface ControlPanelProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onShowCode: () => void;
  envCount: number;
  currentEnvIndex: number;
  onSelectEnv: (index: number) => void;
  viewMode: 'focus' | 'grid';
  onToggleViewMode: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  isPlaying, 
  onTogglePlay, 
  onReset, 
  onShowCode,
  envCount,
  currentEnvIndex,
  onSelectEnv,
  viewMode,
  onToggleViewMode
}) => {
  return (
    <div className="w-full flex flex-col gap-4 mt-6">
      
      {/* Main Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onTogglePlay}
          className={`px-8 py-3 rounded-lg font-bold transition-all shadow-lg transform hover:-translate-y-1 ${
            isPlaying 
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30' 
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
          }`}
        >
          {isPlaying ? 'PAUSE SIMULATION' : 'START SIMULATION'}
        </button>

        <button
          onClick={onReset}
          className="px-8 py-3 rounded-lg font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all shadow-lg hover:shadow-slate-500/20"
        >
          RESET ALL
        </button>

        <button
          onClick={onToggleViewMode}
          className="px-8 py-3 rounded-lg font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg hover:shadow-purple-500/30"
        >
          {viewMode === 'focus' ? 'SWITCH TO GRID VIEW' : 'SWITCH TO FOCUS VIEW'}
        </button>

        <button
          onClick={onShowCode}
          className="px-8 py-3 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          TRAINING SCRIPT
        </button>
      </div>

      {/* Env Selector */}
      <div className={`flex flex-col items-center mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 transition-opacity ${viewMode === 'grid' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <span className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-3">Parallel Environments Focus</span>
        <div className="flex gap-2">
          {Array.from({ length: envCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => onSelectEnv(i)}
              className={`w-12 h-12 rounded-lg font-mono text-lg font-bold border transition-all ${
                currentEnvIndex === i
                  ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)] scale-110'
                  : 'bg-slate-800 border-slate-600 text-slate-500 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;