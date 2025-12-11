
# Usage Guide

## Web Interface Controls

The web interface is the "Command Center" for the Neural League.

### View Modes
1.  **Focus View**: Shows a detailed view of a specific environment. You can switch between environments using the numbered tabs at the bottom.
2.  **Grid View**: Shows all parallel environments simultaneously in a 2x2 layout. This allows you to monitor the population performance at a glance.

### Camera Controls
*   **Rotate**: Left Click + Drag
*   **Pan**: Right Click + Drag
*   **Zoom**: Scroll Wheel

## Training Agents (Python)

To train your own AI models, you will use the Python scripts provided in the `scripts/` directory.

### 1. Install Requirements (Modern Way)
We use **uv** for ultra-fast dependency management.

1.  **Install uv** (if not already installed):
    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

2.  **Sync Dependencies**:
    Navigate to the project root and run:
    ```bash
    uv sync
    ```
    This reads `pyproject.toml` and creates a perfectly reproducible virtual environment in `.venv`.

### 2. Configure WandB
Before training, log in to your WandB account (free) to enable the dashboard. You need to run this inside the environment `uv` created:

```bash
uv run wandb login
```

### 3. Run Training
Execute the training script using `uv run`. This ensures it runs with the correct dependencies without needing to manually activate the virtual environment.

```bash
uv run scripts/train.py
```

This script will:
1.  Initialize 4 parallel CPU environments (`SubprocVecEnv`).
2.  Connect to WandB project `neural-league-5v5`.
3.  Train a PPO model for 2,000,000 timesteps.
4.  Upload live metrics (Reward, Loss, FPS) to your WandB dashboard.

### 4. Visualizing Training (Pygame)
If you want to see the Python training in real-time (slower):
1.  Open `scripts/gym_soccer_env.py` and set `render_mode="human"` in the class metadata (if supported) or handle rendering logic manually.
2.  Note: Rendering slows down training significantly. We recommend trusting the WandB charts!
