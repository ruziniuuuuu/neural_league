
export enum Team {
  RED = 'RED',
  BLUE = 'BLUE',
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface CircleBody {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  mass: number;
  damping: number; // 0-1, friction
}

export interface Player extends CircleBody {
  id: number;
  team: Team;
  maxSpeed: number;
  hasBall: boolean; 
  kickCooldown: number; // Frames until next kick allowed
  lastAction?: 'dribble' | 'pass' | 'shoot'; // For visual effects
}

export interface Ball extends CircleBody {
  isGoal: boolean; 
}

export interface GameState {
  players: Player[];
  ball: Ball;
  score: {
    [Team.RED]: number;
    [Team.BLUE]: number;
  };
  timeStep: number;
  gameOver: boolean;
  lastScorer?: Team;
}

// Action: [moveX, moveY, kickPower]
// kickPower: 0.0-0.3 (Move/Dribble), 0.3-0.7 (Pass), 0.7-1.0 (Shoot)
export type Action = [number, number, number];

export interface EnvironmentConfig {
  width: number;
  height: number;
  goalWidth: number;
  playerRadius: number;
  ballRadius: number;
  matchDurationFrames: number;
}
