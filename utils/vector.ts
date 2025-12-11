import { Vector2 } from '../types';

export const vAdd = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y });
export const vSub = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y });
export const vMult = (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s });
export const vDiv = (v: Vector2, s: number): Vector2 => ({ x: v.x / s, y: v.y / s });
export const vMag = (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const vNorm = (v: Vector2): Vector2 => {
  const m = vMag(v);
  return m === 0 ? { x: 0, y: 0 } : vDiv(v, m);
};
export const vDist = (a: Vector2, b: Vector2): number => vMag(vSub(a, b));
export const vDot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;

// Clamp vector magnitude
export const vLimit = (v: Vector2, max: number): Vector2 => {
  const m = vMag(v);
  if (m > max) {
    return vMult(vNorm(v), max);
  }
  return v;
};
