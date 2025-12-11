import { Action, GameState, Player, Team, Vector2 } from '../types';
import { vSub, vNorm, vMag, vAdd, vDist } from '../utils/vector';
import { FIELD_WIDTH, FIELD_HEIGHT, GOAL_WIDTH, ACTION_THRESHOLDS, NOISE_CONFIG, TEAM_SIZE } from '../constants';

/**
 * STRATEGY OVERVIEW
 * 
 * Dynamic Role Assignment based on TEAM_SIZE:
 * 1. TEAM_SIZE = 1: The One (Box-to-box)
 * 2. TEAM_SIZE = 2: 1 GK, 1 FWD
 * 3. TEAM_SIZE = 3: 1 GK, 1 DEF, 1 FWD
 * 4. TEAM_SIZE = 5: 1 GK, 2 DEF, 2 FWD
 */

const getRole = (id: number): 'GK' | 'DEF' | 'FWD' => {
  if (TEAM_SIZE === 1) return 'FWD'; // 1v1 acts as striker mostly but defends when needed

  // Local ID within the team (0 to TEAM_SIZE - 1)
  const localId = id % TEAM_SIZE;

  // GK is always the first player (0)
  if (localId === 0) return 'GK';

  // Split remaining players
  const fieldPlayerCount = TEAM_SIZE - 1;
  const fieldId = localId - 1; // 0 to fieldPlayerCount - 1

  // First half are Defenders, second half are Strikers
  if (fieldId < fieldPlayerCount / 2) return 'DEF';
  
  return 'FWD';
};

// Helper to add organic imperfection to bot actions
const addNoise = (val: number): number => {
  const noise = (Math.random() - 0.5) * 2 * NOISE_CONFIG.BOT_ACTION_NOISE;
  return Math.max(-1, Math.min(1, val + noise));
};

const getFormationPos = (player: Player, ball: Vector2): Vector2 => {
  // Return a target position based on role and ball position
  const isRed = player.team === Team.RED;
  // Attack direction: Red -> +X, Blue -> -X
  const attackDir = isRed ? 1 : -1; 
  const fieldCenter = FIELD_WIDTH / 2;

  const role = getRole(player.id);

  if (role === 'GK') {
    // GK stays near goal line, tracks ball Y (clamped to box)
    const goalX = isRed ? 40 : FIELD_WIDTH - 40;
    const clampY = Math.max(FIELD_HEIGHT/2 - GOAL_WIDTH, Math.min(FIELD_HEIGHT/2 + GOAL_WIDTH, ball.y));
    return { x: goalX, y: clampY };
  }

  if (role === 'DEF') {
    // Defenders hang back
    const baseX = isRed ? fieldCenter * 0.5 : FIELD_WIDTH - (fieldCenter * 0.5);
    // Dynamic Y offset to prevent stacking
    const localId = player.id % TEAM_SIZE;
    const spread = (localId % 2 === 0) ? -80 : 80; 
    return { x: baseX + (ball.x - fieldCenter) * 0.5, y: ball.y + spread };
  }

  // FWD / Strikers stay forward
  const baseX = isRed ? fieldCenter * 1.5 : fieldCenter * 0.5;
  const localId = player.id % TEAM_SIZE;
  const spread = (localId % 2 === 0) ? -100 : 100;
  
  // If 1v1, FWD plays more center
  if (TEAM_SIZE === 1) return { x: ball.x + (attackDir * 20), y: ball.y };

  return { x: ball.x + (attackDir * 50), y: ball.y + spread };
};

export const getBotAction = (player: Player, state: GameState): Action => {
  const ball = state.ball;
  const role = getRole(player.id);
  const myGoalX = player.team === Team.RED ? 0 : FIELD_WIDTH;
  const targetGoalX = player.team === Team.RED ? FIELD_WIDTH : 0;
  const targetGoal = { x: targetGoalX, y: FIELD_HEIGHT / 2 };

  const toBall = vSub(ball.pos, player.pos);
  const distToBall = vMag(toBall);
  const dirToBall = vNorm(toBall);

  // --- 1. GOALKEEPER LOGIC ---
  if (role === 'GK') {
    const target = getFormationPos(player, ball.pos);
    const toTarget = vSub(target, player.pos);
    
    // If ball is VERY close to goal, rush it
    const dangerZone = 150;
    const ballInZone = Math.abs(ball.pos.x - myGoalX) < dangerZone;
    
    if (ballInZone && distToBall < 100) {
      // Clear the ball
      return [addNoise(dirToBall.x), addNoise(dirToBall.y), ACTION_THRESHOLDS.SHOOT]; 
    }
    
    // Otherwise keep position
    const move = vNorm(toTarget);
    return [addNoise(move.x), addNoise(move.y), 0];
  }

  // --- 2. FIELD PLAYER LOGIC ---
  
  // Who is closest on my team?
  const myTeam = state.players.filter(p => p.team === player.team);
  let closestDist = Infinity;
  let closestId = -1;
  myTeam.forEach(p => {
    const d = vDist(p.pos, ball.pos);
    if (d < closestDist) { closestDist = d; closestId = p.id; }
  });

  const isClosest = player.id === closestId;

  // A. I am closest -> Go for ball
  if (isClosest) {
    if (distToBall < player.radius + ball.radius + 5) {
      // ** I HAVE THE BALL **
      
      const distToGoal = vDist(player.pos, targetGoal);
      
      // Shot chance?
      if (distToGoal < 250) {
        // Aim at goal corners to be fancy
        const localId = player.id % TEAM_SIZE;
        const aimY = (localId % 2 === 0) ? targetGoal.y - 40 : targetGoal.y + 40;
        const shotDir = vNorm(vSub({x: targetGoalX, y: aimY}, player.pos));
        // Move slightly towards shot to align
        return [addNoise(shotDir.x), addNoise(shotDir.y), 1.0]; // Full power
      }

      // Pass chance? (Only if team size > 1)
      if (TEAM_SIZE > 1) {
        const forwardFactor = player.team === Team.RED ? 1 : -1;
        const teammates = myTeam.filter(p => p.id !== player.id);
        let bestMate = null;
        let maxScore = -Infinity;

        teammates.forEach(mate => {
          // Simple heuristic: Further forward + Open line of sight + Reasonable distance
          const forwardDist = (mate.pos.x - player.pos.x) * forwardFactor;
          const dist = vDist(player.pos, mate.pos);
          if (forwardDist > 0 && dist > 100 && dist < 400) {
            if (forwardDist > maxScore) { maxScore = forwardDist; bestMate = mate; }
          }
        });

        if (bestMate) {
          const passDir = vNorm(vSub(bestMate.pos, player.pos));
          return [addNoise(passDir.x), addNoise(passDir.y), 0.5];
        }
      }

      // No pass/shoot? DRIBBLE towards goal
      const driveDir = vNorm(vSub(targetGoal, player.pos));
      return [addNoise(driveDir.x), addNoise(driveDir.y), 0.1]; // Low power = dribble
    } 
    else {
      // Chase ball
      return [addNoise(dirToBall.x), addNoise(dirToBall.y), 0]; 
    }
  }

  // B. I am NOT closest -> Support / Formation
  const targetPos = getFormationPos(player, ball.pos);
  const toTarget = vSub(targetPos, player.pos);
  const distToTarget = vMag(toTarget);

  if (distToTarget > 10) {
    const move = vNorm(toTarget);
    return [addNoise(move.x), addNoise(move.y), 0];
  }

  // Idle
  return [0, 0, 0];
};