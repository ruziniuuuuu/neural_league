import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameScene from './components/GameScene';
import ScoreBoard from './components/ScoreBoard';
import ControlPanel from './components/ControlPanel';
import PythonExport from './components/PythonExport';
import { MultiEnvManager } from './core/MultiEnvManager';
import { GameState } from './types';

// Initialize Manager with 4 parallel environments
const envManager = new MultiEnvManager(4);

function App() {
  const [currentEnvIdx, setCurrentEnvIdx] = useState(0);
  const [visualState, setVisualState] = useState<GameState>(envManager.getState(0));
  const [allStates, setAllStates] = useState<GameState[]>(envManager.getAllStates());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [viewMode, setViewMode] = useState<'focus' | 'grid'>('focus');
  
  const animationFrameRef = useRef<number>(0);

  const gameLoop = useCallback(() => {
    if (isPlaying) {
      envManager.stepAll();
    }
    
    // Update both the focused state and the array of all states
    setVisualState({ ...envManager.getState(currentEnvIdx) });
    setAllStates([...envManager.getAllStates()]);

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, currentEnvIdx]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameLoop]);

  const handleReset = () => {
    setIsPlaying(false);
    envManager.resetAll();
    setVisualState({ ...envManager.getState(currentEnvIdx) });
    setAllStates([...envManager.getAllStates()]);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-6xl flex flex-col items-center">
        
        <header className="mb-6 text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 mb-2 tracking-tight">
            NEURAL LEAGUE <span className="text-white text-2xl font-light opacity-50">3D</span>
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            Scalable Multi-Agent Reinforcement Learning Environment
          </p>
        </header>

        {viewMode === 'focus' ? (
           <ScoreBoard score={visualState.score} timeStep={visualState.timeStep} />
        ) : (
          <div className="h-20 flex items-center justify-center">
             <h2 className="text-2xl font-bold text-slate-500 tracking-widest">GLOBAL OBSERVATION MODE</h2>
          </div>
        )}
        
        <GameScene 
          gameState={visualState} 
          allStates={allStates}
          viewMode={viewMode}
          currentEnvIndex={currentEnvIdx}
        />

        <ControlPanel 
          isPlaying={isPlaying} 
          onTogglePlay={() => setIsPlaying(!isPlaying)} 
          onReset={handleReset}
          onShowCode={() => setShowCode(true)}
          envCount={envManager.getCount()}
          currentEnvIndex={currentEnvIdx}
          onSelectEnv={(idx) => {
            setCurrentEnvIdx(idx);
            setViewMode('focus'); // Switch back to focus if selecting specific env
          }}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(prev => prev === 'focus' ? 'grid' : 'focus')}
        />
        
        <div className="mt-8 grid grid-cols-3 gap-8 text-center text-slate-500 text-xs font-mono max-w-3xl border-t border-slate-800 pt-6">
          <div>
            <h4 className="text-slate-300 font-bold mb-1">FRONTEND</h4>
            <p>React Three Fiber (WebGL)</p>
          </div>
          <div>
            <h4 className="text-slate-300 font-bold mb-1">PHYSICS</h4>
            <p>Custom 2.5D Engine (TS)</p>
          </div>
          <div>
            <h4 className="text-slate-300 font-bold mb-1">TRAINING</h4>
            <p>Gymnasium + PPO (Python)</p>
          </div>
        </div>
      </div>

      <PythonExport isOpen={showCode} onClose={() => setShowCode(false)} />
    </div>
  );
}

export default App;