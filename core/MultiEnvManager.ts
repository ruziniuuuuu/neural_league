import { SoccerEnv } from './SoccerEnv';
import { GameState, Action } from '../types';
import { getBotAction } from './BotLogic';

export class MultiEnvManager {
  private envs: SoccerEnv[];
  private count: number;

  constructor(count: number = 4) {
    this.count = count;
    this.envs = [];
    for (let i = 0; i < count; i++) {
      this.envs.push(new SoccerEnv());
    }
  }

  public stepAll(): void {
    this.envs.forEach(env => {
      // Get bot actions for this specific env
      // In a real training scenario, this would come from a neural network inference batch
      const actions: Action[] = env.state.players.map(p => getBotAction(p, env.state));
      env.step(actions);
    });
  }

  public getState(index: number): GameState {
    if (index < 0 || index >= this.count) return this.envs[0].state;
    return this.envs[index].state;
  }

  public getAllStates(): GameState[] {
    return this.envs.map(env => env.state);
  }

  public resetAll(): void {
    this.envs.forEach(env => env.reset());
  }

  public resetEnv(index: number): void {
     if (index >= 0 && index < this.count) {
       this.envs[index].reset();
     }
  }

  public getCount(): number {
    return this.count;
  }
}