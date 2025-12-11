
import { EnvironmentConfig, Team } from './types';

// --- CONFIGURATION ---
// Change this value to switch between 1v1, 3v3, 5v5, etc.
export const TEAM_SIZE: number = 5; 

// Field Dimensions (Abstract units)
export const FIELD_WIDTH = 800;
export const FIELD_HEIGHT = 500;
export const GOAL_WIDTH = 140; 

export const ENV_CONFIG: EnvironmentConfig = {
  width: FIELD_WIDTH,
  height: FIELD_HEIGHT,
  goalWidth: GOAL_WIDTH,
  playerRadius: 14,
  ballRadius: 7,
  matchDurationFrames: 3600,
};

// Randomness Configuration
export const NOISE_CONFIG = {
  // Random position offset (pixels) at start
  INIT_JITTER: 15, 
  // Random ball velocity at start
  BALL_INIT_VEL: 2.0,
  // Random noise added to bot movement/aim vector (-0.1 to 0.1)
  BOT_ACTION_NOISE: 0.15, 
};

export const PHYSICS = {
  PLAYER_MASS: 70,
  BALL_MASS: 0.8,
  PLAYER_MAX_SPEED: 4.5,
  PLAYER_ACCELERATION: 0.6,
  PLAYER_DAMPING: 0.92, 
  BALL_DAMPING: 0.975, // Higher friction so ball doesn't roll forever
  
  // Kick Mechanics
  KICK_COOLDOWN: 15, // Frames between kicks
  DRIBBLE_DIST: 20,  // Distance to activate magnetic dribble
  DRIBBLE_FORCE: 0.8,
  PASS_FORCE: 8.0,
  SHOOT_FORCE: 15.0,

  ELASTICITY_WALL: 0.7,
  ELASTICITY_PLAYER: 0.5,
  ELASTICITY_BALL: 0.7,
};

// Action Thresholds
export const ACTION_THRESHOLDS = {
  DRIBBLE: 0.0, // Implicit if moving
  PASS: 0.4,
  SHOOT: 0.8
};

export enum PlayerRole {
  GK = 'GK',
  DEFENDER = 'DEFENDER',
  STRIKER = 'STRIKER'
}

export const TEAM_COLORS = {
  [Team.RED]: {
    primary: '#ef4444', 
    secondary: '#7f1d1d',
    glow: 'rgba(239, 68, 68, 0.6)',
  },
  [Team.BLUE]: {
    primary: '#3b82f6', 
    secondary: '#1e3a8a', 
    glow: 'rgba(59, 130, 246, 0.6)',
  },
};