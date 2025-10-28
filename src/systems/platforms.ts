import type { Collider } from '../engine/physics';
import { setTranslation } from '../engine/x3d';
import type { MovingPlatformsConfig } from '../config/GameConfig';
import type { AABB } from '../engine/types';

export interface MovingPlatformState {
  collider: Collider;
  originX: number;
  originY: number;
  axis: 'x' | 'y';
  amplitude: number;
  speed: number; // radians per second for sine wave
  phase: number;
  lastX: number;
  lastY: number;
  lastDX: number;
  lastDY: number;
}

export function buildMovingPlatforms(colliders: Collider[], cfg: MovingPlatformsConfig): MovingPlatformState[] {
  if (!cfg.enabled) return [];
  const list: MovingPlatformState[] = [];
  for (const c of colliders) {
    if (c.type !== 'moving_platform') continue;
    const axis = c.motion?.axis ?? 'y';
    const amplitude = c.motion?.amplitude ?? cfg.defaultAmplitude;
    const speed = c.motion?.speed ?? cfg.defaultSpeed;
    const phase = c.motion?.phase ?? 0;
    list.push({
      collider: c,
      originX: c.pos.x,
      originY: c.pos.y,
      axis,
      amplitude,
      speed,
      phase,
      lastX: c.pos.x,
      lastY: c.pos.y,
      lastDX: 0,
      lastDY: 0
    });
  }
  return list;
}

export function updateMovingPlatforms(platforms: MovingPlatformState[], deltaTime: number): void {
  for (const p of platforms) {
    p.phase += p.speed * deltaTime;
    const offset = Math.sin(p.phase) * p.amplitude;
    const oldX = p.collider.pos.x;
    const oldY = p.collider.pos.y;
    if (p.axis === 'y') p.collider.pos.y = p.originY + offset; else p.collider.pos.x = p.originX + offset;
    p.lastDX = p.collider.pos.x - oldX;
    p.lastDY = p.collider.pos.y - oldY;
    p.lastX = p.collider.pos.x;
    p.lastY = p.collider.pos.y;
    if (p.collider.node) {
      setTranslation(p.collider.node, p.collider.pos.x, p.collider.pos.y, p.collider.pos.z);
    }
  }
}

// Returns total delta to apply to player if standing on any moving platform
export function computeRideDeltaForPlayer(playerAABB: AABB, platforms: MovingPlatformState[]): { dx: number; dy: number } {
  const EPS = 0.12; // tolerance for bottom-to-top contact
  let dx = 0, dy = 0;
  for (const p of platforms) {
    const b = { x: p.collider.pos.x, y: p.collider.pos.y, z: p.collider.pos.z, w: p.collider.size.x, h: p.collider.size.y, d: p.collider.size.z };
    const horizOverlap = Math.abs(playerAABB.x - b.x) * 2 <= (playerAABB.w + b.w);
    if (!horizOverlap) continue;
    const playerBottom = playerAABB.y - playerAABB.h / 2;
    const platTop = b.y + b.h / 2;
    const above = playerAABB.y >= b.y;
    if (!above) continue;
    const verticalGap = Math.abs(playerBottom - platTop);
    if (verticalGap <= EPS) {
      dx += p.lastDX;
      dy += p.lastDY;
    }
  }
  return { dx, dy };
}
