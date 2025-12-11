# System Architecture

The project is divided into two distinct but synchronized parts: the **Frontend Visualizer** (TypeScript) and the **Training Backend** (Python).

## 1. Frontend (Web Visualizer)

The frontend is responsible for visualizing the agents' behavior and running the physics engine in the browser for demonstration purposes.

### Core Stack
*   **React**: UI Framework.
*   **React Three Fiber (R3F)**: A React renderer for Three.js, handling the 3D scene.
*   **Tailwind CSS**: For the HUD and control panels.

### Modules
*   **`core/SoccerEnv.ts`**: The TypeScript implementation of the physics engine. It handles collision detection, velocity updates, and game rules (goals, boundaries).
*   **`core/MultiEnvManager.ts`**: A manager class that instantiates multiple `SoccerEnv` classes. It iterates through them in a loop, simulating parallel execution.
*   **`components/GameScene.tsx`**: The 3D rendering component. It supports two modes:
    *   **Focus Mode**: Renders a single match with a close-up camera.
    *   **Grid Mode**: Renders all active environments in a spatial grid.

## 2. Backend (RL Training)

The backend is where the actual Reinforcement Learning happens.

### Core Stack
*   **Gymnasium**: The standard API for RL environments.
*   **Stable-Baselines3**: The PPO implementation.
*   **Pygame**: Used for optional server-side rendering during training debugging.

---

## 3. Multi-Agent Training Architecture (MARL)

Neural League supports flexible training architectures for Multi-Agent scenarios (e.g., 3v3, 5v5). Below is the recommended approach for training agents in this environment.

### A. Centralized Training, Decentralized Execution (CTDE) vs. Shared Parameter PPO

For this project, we primarily use **Shared Parameter PPO (IPPO)** or a **Centralized Controller** approach depending on the observation space design.

#### The "Centralized Controller" Approach (Simplified)
In the provided default configuration, the environment exposes a **single large action space** representing the entire team.
*   **Action Space**: `Box(-1, 1, shape=(TEAM_SIZE * 3,))`. Each chunk of 3 numbers controls one player `[moveX, moveY, kick]`.
*   **Observation Space**: `Box(-inf, inf, shape=(4 + TEAM_SIZE * 4,))`. The state contains all player positions and velocities.
*   **Pros**: Simplifies implementation into standard Single-Agent RL libraries (like `stable-baselines3`). The "Brain" controls all puppets simultaneously.
*   **Cons**: Harder to scale to very large numbers of agents due to exponential growth in action space complexity.

#### The "Independent Learner" Approach (Scalable)
To scale to 5v5 or 11v11 effectively, you should treat each player as an independent agent sharing the same policy network (Parameter Sharing).

1.  **Network**: Single PPO Policy Network (`input -> [Actions]`).
2.  **Input (Observation)**:
    *   **Egocentric**: Transform global coordinates to be relative to the specific player.
    *   **Vector**: `[Self_Vel, Rel_Pos_Ball, Rel_Pos_Teammates, Rel_Pos_Enemies]`.
3.  **Batching**:
    *   In one environment step, you collect `TEAM_SIZE` observations.
    *   Pass all `TEAM_SIZE` observations to the PPO model as a batch.
    *   Receive `TEAM_SIZE` actions.
    *   Step the environment.
    *   Reward is usually shared (Team Reward) to encourage cooperation.

### B. Algorithm Flow (PPO)

We use **Proximal Policy Optimization (PPO)** due to its stability and ease of tuning.

1.  **Rollout Phase**:
    *   Run `N` parallel environments (e.g., 8 CPU cores).
    *   Collect `T` timesteps of data (State, Action, Reward, Next State).
2.  **Advantage Estimation**:
    *   Use Generalized Advantage Estimation (GAE) to calculate how good an action was compared to the average.
3.  **Optimization Phase**:
    *   Update the Neural Network to maximize the probability of good actions while ensuring the update isn't too large (Clipping).
    *   **Entropy Regularization** is crucial here to prevent early convergence (e.g., all agents deciding to just stand in goal).

### C. Reward Shaping
Designing rewards is critical for soccer. A recommended reward function for Neural League:
*   `+10.0`: Scoring a Goal (Team Shared).
*   `-10.0`: Conceding a Goal (Team Shared).
*   `+0.1 * (PrevDistToBall - CurrDistToBall)`: Dense reward for moving towards the ball (Individual).
*   `+0.5`: Touching the ball.
*   `+1.0 * (PrevBallDistToGoal - CurrBallDistToGoal)`: Dense reward for moving ball closer to enemy goal.

### D. Scalability Notes
*   **1v1**: Focuses on mechanical skill (dribbling).
*   **5v5**: Focuses on passing and positioning. You may need to introduce "Formation Rewards" (penalizing agents for bunching up) to help the AI discover spacing concepts early in training.