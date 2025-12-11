import React from 'react';
import { TEAM_SIZE } from '../constants';

const TOTAL_PLAYERS = TEAM_SIZE * 2;
const OBS_DIM = 4 + (TOTAL_PLAYERS * 4); // Ball (4) + Players (4 * count)
const ACT_DIM = TOTAL_PLAYERS * 3; // Players (3 * count)

const PYTHON_GYM_SCRIPT = `import gymnasium as gym
import numpy as np
from gymnasium import spaces

class NeuralLeagueEnv(gym.Env):
    """
    A custom Gymnasium environment for Neural League (${TEAM_SIZE}v${TEAM_SIZE}).
    Configured for TEAM_SIZE = ${TEAM_SIZE}
    """
    metadata = {"render_modes": ["human", "rgb_array"], "render_fps": 60}

    def __init__(self):
        # Configuration
        self.team_size = ${TEAM_SIZE}
        self.total_players = self.team_size * 2
        
        # Action Space: [moveX, moveY, kickPower] for each player
        # Flattened shape: (${ACT_DIM},)
        # Low: -1.0, High: 1.0
        self.action_space = spaces.Box(low=-1.0, high=1.0, shape=(${ACT_DIM},), dtype=np.float32)
        
        # Observation Space: 
        # Ball (x, y, vx, vy) 
        # + For each player (x, y, vx, vy)
        # Shape: (${OBS_DIM},)
        self.observation_space = spaces.Box(low=-np.inf, high=np.inf, shape=(${OBS_DIM},), dtype=np.float32)

        self.width = 800
        self.height = 500
        self.reset()

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.state = self._create_initial_state()
        return self._get_obs(), {}

    def step(self, actions):
        # actions is a numpy array of shape (${ACT_DIM},)
        # You need to split this into chunks of 3 for each player
        
        self._apply_logic(actions)
        
        terminated = False 
        truncated = False
        reward = self._calculate_reward()
        
        return self._get_obs(), reward, terminated, truncated, {}

    def _get_obs(self):
        # Return flattened state of shape (${OBS_DIM},)
        return np.zeros(${OBS_DIM}, dtype=np.float32) 

    def _create_initial_state(self):
        # Implement dynamic formation logic (GK, Defenders, Strikers) based on self.team_size
        return {}

    def _apply_logic(self, actions):
        # Implementation matches TypeScript physics engine
        pass

    def _calculate_reward(self):
        # Reward shaping: Goals +10, Concede -10, Ball to Goal distance, etc.
        return 0.0

if __name__ == "__main__":
    env = NeuralLeagueEnv()
    obs, _ = env.reset()
    print(f"Neural League ${TEAM_SIZE}v${TEAM_SIZE} Ready.")
    print("Observation shape:", obs.shape)
    print("Action shape:", env.action_space.shape)
    
    # Random Test
    for _ in range(100):
        action = env.action_space.sample()
        obs, reward, done, _, _ = env.step(action)
        if done:
            env.reset()
`;

interface PythonExportProps {
  isOpen: boolean;
  onClose: () => void;
}

const PythonExport: React.FC<PythonExportProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-slate-800 w-full max-w-4xl h-[80vh] rounded-xl border border-slate-600 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700 bg-slate-900">
          <h3 className="text-lg font-bold text-slate-100">Gymnasium Environment Script</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-[#0d1117] p-6">
          <p className="text-slate-400 text-sm mb-4 border-b border-slate-700 pb-2">
            This script is dynamically generated based on current settings: <strong className="text-emerald-400">Team Size = {TEAM_SIZE}</strong>.
          </p>
          <pre className="text-sm font-mono text-emerald-400 whitespace-pre">
            <code>{PYTHON_GYM_SCRIPT}</code>
          </pre>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900 flex justify-end">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(PYTHON_GYM_SCRIPT);
              alert("Code copied to clipboard!");
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-sm"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PythonExport;