# Welcome to Neural League

**Neural League** is a high-performance, aesthetically pleasing 3D soccer simulation environment designed for Scalable Multi-Agent Reinforcement Learning (MARL) research.

![Banner](https://img.shields.io/badge/Status-Active-success)

## Key Features

1.  **Scalable Team Sizes**: Easily configure 1v1, 3v3, 5v5, or any other size via simple configuration constants.
2.  **Browser-Based 3D Visualization**: Built with React Three Fiber, allowing you to watch agents play in real-time with high-quality rendering.
3.  **Parallel Environment Support**: The engine runs multiple matches simultaneously in the background (simulating `SubprocVecEnv`), and can visualize them in a "Mega-Grid" view.
4.  **Gymnasium Compatible**: Fully compliant with the standard Python `gymnasium` API for easy integration with libraries like `stable-baselines3`, `rllib`, or `cleanrl`.
5.  **Custom Physics Engine**: A deterministic 2.5D physics engine written in TypeScript (for the web) and mirrored in Python (for training) ensures fast and consistent simulation.

## Getting Started

To get the web visualizer running immediately:

```bash
npm install
npm run dev
```

Then visit `http://localhost:5173`.