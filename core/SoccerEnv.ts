import { Action, Ball, GameState, Player, Team, Vector2 } from '../types';
import { ENV_CONFIG, PHYSICS, FIELD_WIDTH, FIELD_HEIGHT, ACTION_THRESHOLDS, NOISE_CONFIG, TEAM_SIZE } from '../constants';
import { vAdd, vSub, vMult, vMag, vNorm, vDot, vLimit, vDist } from '../utils/vector';

export class SoccerEnv {
  public state: GameState;
  
  constructor() {
    this.state = this.createInitialState();
  }

  // Helper for random jitter
  private jitter(amount: number): number {
    return (Math.random() - 0.5) * 2 * amount;
  }

  // Generates starting positions based on team size and side
  private getFormation(teamSize: number, isLeft: boolean): Vector2[] {
    const w = FIELD_WIDTH;
    const h = FIELD_HEIGHT;
    const midX = w / 2;
    const goalX = isLeft ? 50 : w - 50;
    const forwardDir = isLeft ? 1 : -1;
    
    const positions: Vector2[] = [];

    // 1. Goalkeeper (Always index 0 in local list if size > 1, or just the player if size=1)
    if (teamSize === 1) {
       // 1v1: Start slightly forward
       positions.push({ x: midX - (forwardDir * 100), y: h / 2 });
       return positions;
    }

    // GK Position
    positions.push({ x: goalX, y: h / 2 });

    // Remaining players
    const fieldPlayers = teamSize - 1;

    if (fieldPlayers === 1) {
      // 2v2: GK + 1 Striker
      positions.push({ x: midX - (forwardDir * 50), y: h / 2 });
    } else if (fieldPlayers === 2) {
      // 3v3: GK + 1 Def + 1 Att
      positions.push({ x: goalX + (forwardDir * 150), y: h / 2 }); // Def
      positions.push({ x: midX - (forwardDir * 50), y: h / 2 }); // Att
    } else if (fieldPlayers === 3) {
       // 4v4: GK + 1 Def + 2 Att
       positions.push({ x: goalX + (forwardDir * 150), y: h / 2 }); // Def
       positions.push({ x: midX - (forwardDir * 50), y: h / 2 - 80 }); // Att Top
       positions.push({ x: midX - (forwardDir * 50), y: h / 2 + 80 }); // Att Bot
    } else {
      // 5v5 (Standard): GK + 2 Def + 2 Att
      // Defenders
      positions.push({ x: goalX + (forwardDir * 150), y: h / 3 });
      positions.push({ x: goalX + (forwardDir * 150), y: h * 2 / 3 });
      // Strikers
      positions.push({ x: midX - (forwardDir * 50), y: h / 2 - 50 });
      positions.push({ x: midX - (forwardDir * 50), y: h / 2 + 50 });
    }

    return positions;
  }

  private createInitialState(): GameState {
    const players: Player[] = [];
    
    // RED Team (Left)
    const redPositions = this.getFormation(TEAM_SIZE, true);
    redPositions.forEach((pos, i) => {
      const startPos = { 
        x: pos.x + this.jitter(NOISE_CONFIG.INIT_JITTER), 
        y: pos.y + this.jitter(NOISE_CONFIG.INIT_JITTER) 
      };
      players.push(this.createPlayer(i, Team.RED, startPos));
    });

    // BLUE Team (Right)
    const bluePositions = this.getFormation(TEAM_SIZE, false);
    bluePositions.forEach((pos, i) => {
      const startPos = { 
        x: pos.x + this.jitter(NOISE_CONFIG.INIT_JITTER), 
        y: pos.y + this.jitter(NOISE_CONFIG.INIT_JITTER) 
      };
      // ID continues after Red Team
      players.push(this.createPlayer(i + TEAM_SIZE, Team.BLUE, startPos));
    });

    // Ball starts in center with tiny random velocity to break symmetry immediately
    const ball: Ball = {
      pos: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 },
      vel: { 
        x: this.jitter(NOISE_CONFIG.BALL_INIT_VEL), 
        y: this.jitter(NOISE_CONFIG.BALL_INIT_VEL) 
      },
      radius: ENV_CONFIG.ballRadius,
      mass: PHYSICS.BALL_MASS,
      damping: PHYSICS.BALL_DAMPING,
      isGoal: false,
    };

    return {
      players,
      ball,
      score: { [Team.RED]: 0, [Team.BLUE]: 0 },
      timeStep: 0,
      gameOver: false,
    };
  }

  private createPlayer(id: number, team: Team, pos: Vector2): Player {
    return {
      id,
      team,
      pos,
      vel: { x: 0, y: 0 },
      radius: ENV_CONFIG.playerRadius,
      mass: PHYSICS.PLAYER_MASS,
      damping: PHYSICS.PLAYER_DAMPING,
      maxSpeed: PHYSICS.PLAYER_MAX_SPEED,
      hasBall: false,
      kickCooldown: 0,
    };
  }

  public reset(): GameState {
    this.state = this.createInitialState();
    return this.state;
  }

  private resetPositions(): void {
    // Preserve score, but reset positions with new jitter
    const initial = this.createInitialState();
    this.state.players = initial.players;
    this.state.ball = initial.ball;
  }

  public step(actions: Action[]): GameState {
    if (this.state.gameOver) return this.state;

    this.applyActions(actions);
    this.updatePhysics();
    this.checkCollisions();
    this.checkBoundariesAndGoals();

    this.state.timeStep += 1;
    return this.state;
  }

  private applyActions(actions: Action[]) {
    this.state.players.forEach((p, idx) => {
      // Cooldown management
      if (p.kickCooldown > 0) p.kickCooldown--;

      const action = actions[idx];
      if (!action) return;

      const [moveX, moveY, kickInput] = action;

      // 1. Movement
      const force = { x: moveX * PHYSICS.PLAYER_ACCELERATION, y: moveY * PHYSICS.PLAYER_ACCELERATION };
      p.vel = vAdd(p.vel, force);
      p.vel = vLimit(p.vel, p.maxSpeed);

      // 2. Ball Interaction
      const distToBall = vDist(p.pos, this.state.ball.pos);
      const touchDist = p.radius + this.state.ball.radius + 5;
      
      p.lastAction = undefined; // Reset visual state

      if (distToBall < touchDist) {
        p.hasBall = true;
        
        // --- Dribble Assist (Magnetic) ---
        // If moving, not kicking hard, and close -> ball follows player slightly
        if (kickInput < ACTION_THRESHOLDS.PASS && vMag(p.vel) > 0.5) {
          const dribbleForce = vMult(vNorm(p.vel), PHYSICS.DRIBBLE_FORCE);
          this.state.ball.vel = vAdd(this.state.ball.vel, dribbleForce);
          p.lastAction = 'dribble';
        }

        // --- Active Kick ---
        if (kickInput >= ACTION_THRESHOLDS.PASS && p.kickCooldown === 0) {
          // Determine Kick Direction: Default to velocity, else towards center/goal
          let kickDir = vNorm(p.vel);
          if (vMag(kickDir) === 0) {
            kickDir = vNorm(vSub(this.state.ball.pos, p.pos));
          }
          
          let forceMagnitude = 0;
          
          if (kickInput >= ACTION_THRESHOLDS.SHOOT) {
             // SHOOT
             forceMagnitude = PHYSICS.SHOOT_FORCE;
             p.kickCooldown = PHYSICS.KICK_COOLDOWN;
             p.lastAction = 'shoot';
          } else {
             // PASS
             forceMagnitude = PHYSICS.PASS_FORCE;
             p.kickCooldown = Math.floor(PHYSICS.KICK_COOLDOWN / 2);
             p.lastAction = 'pass';
          }

          this.state.ball.vel = vAdd(this.state.ball.vel, vMult(kickDir, forceMagnitude));
        }
      } else {
        p.hasBall = false;
      }
    });
  }

  private updatePhysics() {
    this.state.players.forEach(p => {
      p.pos = vAdd(p.pos, p.vel);
      p.vel = vMult(p.vel, p.damping);
    });

    const b = this.state.ball;
    b.pos = vAdd(b.pos, b.vel);
    b.vel = vMult(b.vel, b.damping);
    if (vMag(b.vel) < 0.05) b.vel = { x: 0, y: 0 };
  }

  private checkCollisions() {
    // Player vs Player
    for (let i = 0; i < this.state.players.length; i++) {
      for (let j = i + 1; j < this.state.players.length; j++) {
        const p1 = this.state.players[i];
        const p2 = this.state.players[j];
        const dist = vDist(p1.pos, p2.pos);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist) {
          const normal = vNorm(vSub(p1.pos, p2.pos));
          const overlap = minDist - dist;
          p1.pos = vAdd(p1.pos, vMult(normal, overlap / 2));
          p2.pos = vSub(p2.pos, vMult(normal, overlap / 2));
          
          // Simple bounce
          const relativeVel = vSub(p1.vel, p2.vel);
          const sepVel = vDot(relativeVel, normal);
          const impulse = -sepVel * PHYSICS.ELASTICITY_PLAYER;
          const impulseVec = vMult(normal, impulse * 0.5);
          p1.vel = vAdd(p1.vel, impulseVec);
          p2.vel = vSub(p2.vel, impulseVec);
        }
      }
    }

    // Player vs Ball
    const ball = this.state.ball;
    this.state.players.forEach(p => {
      const dist = vDist(p.pos, ball.pos);
      const minDist = p.radius + ball.radius;

      if (dist < minDist) {
        const normal = vNorm(vSub(ball.pos, p.pos));
        const overlap = minDist - dist;
        ball.pos = vAdd(ball.pos, vMult(normal, overlap));
        
        // Physics bounce only if not dribbling (handled in actions)
        if (!p.hasBall) {
           const relativeVel = vSub(ball.vel, p.vel);
           const sepVel = vDot(relativeVel, normal);
           const impulse = -sepVel * PHYSICS.ELASTICITY_BALL;
           ball.vel = vAdd(ball.vel, vMult(normal, impulse + 0.5));
        }
      }
    });
  }

  private checkBoundariesAndGoals() {
    const ball = this.state.ball;
    const { width, height, goalWidth, ballRadius } = ENV_CONFIG;

    // Y Walls
    if (ball.pos.y - ballRadius < 0) {
      ball.pos.y = ballRadius;
      ball.vel.y *= -PHYSICS.ELASTICITY_WALL;
    } else if (ball.pos.y + ballRadius > height) {
      ball.pos.y = height - ballRadius;
      ball.vel.y *= -PHYSICS.ELASTICITY_WALL;
    }

    // X Walls & Goals
    const goalTop = height / 2 - goalWidth / 2;
    const goalBottom = height / 2 + goalWidth / 2;
    const inGoalY = ball.pos.y > goalTop && ball.pos.y < goalBottom;

    // Left (Red Goal)
    if (ball.pos.x - ballRadius < 0) {
      if (inGoalY) this.handleGoal(Team.BLUE);
      else {
        ball.pos.x = ballRadius;
        ball.vel.x *= -PHYSICS.ELASTICITY_WALL;
      }
    }

    // Right (Blue Goal)
    if (ball.pos.x + ballRadius > width) {
      if (inGoalY) this.handleGoal(Team.RED);
      else {
        ball.pos.x = width - ballRadius;
        ball.vel.x *= -PHYSICS.ELASTICITY_WALL;
      }
    }

    // Player Bounds
    this.state.players.forEach(p => {
      if (p.pos.x - p.radius < 0) p.pos.x = p.radius;
      if (p.pos.x + p.radius > width) p.pos.x = width - p.radius;
      if (p.pos.y - p.radius < 0) p.pos.y = p.radius;
      if (p.pos.y + p.radius > height) p.pos.y = height - p.radius;
    });
  }

  private handleGoal(scoringTeam: Team) {
    this.state.score[scoringTeam]++;
    this.state.lastScorer = scoringTeam;
    this.state.ball.isGoal = true;
    this.state.ball.vel = { x: 0, y: 0 };
    this.resetPositions();
  }
}