import React from 'react';
import { GameState, Team } from '../types';
import { TEAM_COLORS } from '../constants';

interface ScoreBoardProps {
  score: GameState['score'];
  timeStep: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, timeStep }) => {
  // Convert frames to approx time (assuming 60fps)
  const seconds = Math.floor(timeStep / 60);
  const minutes = Math.floor(seconds / 60);
  const displaySec = (seconds % 60).toString().padStart(2, '0');
  const displayMin = minutes.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-between w-full max-w-2xl px-8 py-4 bg-slate-800 rounded-xl shadow-lg mb-6 border border-slate-700">
      
      {/* Red Team */}
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold tracking-wider" style={{ color: TEAM_COLORS[Team.RED].primary }}>RED</h2>
        <span className="text-4xl font-mono font-black text-white">{score[Team.RED]}</span>
      </div>

      {/* Timer / Status */}
      <div className="flex flex-col items-center px-6">
        <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Match Time</div>
        <div className="text-3xl font-mono text-slate-100 bg-slate-900 px-4 py-1 rounded border border-slate-700">
          {displayMin}:{displaySec}
        </div>
      </div>

      {/* Blue Team */}
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold tracking-wider" style={{ color: TEAM_COLORS[Team.BLUE].primary }}>BLUE</h2>
        <span className="text-4xl font-mono font-black text-white">{score[Team.BLUE]}</span>
      </div>
    </div>
  );
};

export default ScoreBoard;
