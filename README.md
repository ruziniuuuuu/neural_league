# Neural League 5v5 (3D Edition)

A high-performance, aesthetically pleasing 3D 5vs5 soccer simulation environment designed for Reinforcement Learning (RL) research.

This project features:
1.  **Web Visualizer**: A React Three Fiber (R3F) based 3D interface that runs the physics engine in the browser. It supports **parallel environments**, simulating multiple matches simultaneously.
2.  **RL Training Framework**: A production-ready Python setup using `stable-baselines3` for training PPO agents with parallelized environments.

## 🌟 Features

- **3D Visualization**: Beautiful low-poly aesthetic using Three.js.
- **Parallel Simulation**: The web app runs multiple matches in background web workers/threads logic.
- **Gymnasium Compatible**: Fully compliant `gymnasium` interface.
- **PPO Ready**: Includes scripts to train agents using Proximal Policy Optimization.
- **Modern Tooling**: Uses **uv** for ultra-fast Python dependency management.

## 🚀 Quick Start (Web Visualizer)

### Prerequisites
- Node.js (v16+)
- npm

### Installation & Run

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the 3D App:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:5173`. You can switch between running environments using the tabs at the bottom.

## 🧠 RL Training (Python)

We use **uv** to manage Python dependencies and **stable-baselines3** for training.

### 1. Install uv
If you haven't installed `uv` yet:
```bash
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Setup & Train

No need to manually create virtualenvs. `uv` handles everything.

```bash
# Sync dependencies (creates .venv automatically)
uv sync

# Run the training script
uv run scripts/train.py
```

- To see the Python-based visualization (Pygame window), modify `scripts/train.py` and set `render_mode="human"` in the environment creation (note: this slows down training significantly).

### Files
- `scripts/gym_soccer_env.py`: The core Gymnasium environment with Pygame renderer.
- `scripts/train.py`: The PPO training loop with checkpoint saving.

## 📂 Architecture

- **Frontend**: React + Three.js (`@react-three/fiber`).
    - `components/GameScene.tsx`: The 3D World.
    - `core/MultiEnvManager.ts`: Handles parallel game loops.
- **Backend**: Python + Gymnasium.
    - Logic is kept in sync between TS and Python manually to ensure the web visualizer represents the training environment accurately.

## 🎮 Controls (Web)
- **Orbit**: Left Click + Drag
- **Pan**: Right Click + Drag
- **Zoom**: Scroll
