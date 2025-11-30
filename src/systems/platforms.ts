import type { Collider } from '../engine/physics';
import { colliderToAABB } from '../engine/physics';
import { setTranslation } from '../engine/x3d';
import type { MovingPlatformsConfig } from '../config/GameConfig';
import type { AABB } from '../engine/types';
import { isOnTop } from '../engine/collision';

export interface MovingPlatformState {
  collider: Collider;
  originX: number;
  originY: number;
  originZ: number;
  axis: 'x' | 'y' | 'z';
  amplitude: number;
  speed: number; // radians per second for sine wave
  phase: number;
  lastX: number;
  lastY: number;
  lastZ: number;
  lastDX: number;
  lastDY: number;
  lastDZ: number;
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
      originZ: c.pos.z,
      axis,
      amplitude,
      speed,
      phase,
      lastX: c.pos.x,
      lastY: c.pos.y,
      lastZ: c.pos.z,
      lastDX: 0,
      lastDY: 0,
      lastDZ: 0
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
    const oldZ = p.collider.pos.z;
    
    if (p.axis === 'y') {
      p.collider.pos.y = p.originY + offset;
    } else if (p.axis === 'x') {
      p.collider.pos.x = p.originX + offset;
    } else if (p.axis === 'z') {
      p.collider.pos.z = p.originZ + offset;
    }
    
    p.lastDX = p.collider.pos.x - oldX;
    p.lastDY = p.collider.pos.y - oldY;
    p.lastDZ = p.collider.pos.z - oldZ;
    p.lastX = p.collider.pos.x;
    p.lastY = p.collider.pos.y;
    p.lastZ = p.collider.pos.z;
    
    if (p.collider.node) {
      setTranslation(p.collider.node, p.collider.pos.x, p.collider.pos.y, p.collider.pos.z);
    }
  }
}

// Returns total delta to apply to player if standing on any moving platform
export function computeRideDeltaForPlayer(playerAABB: AABB, platforms: MovingPlatformState[]): { dx: number; dy: number } {
  let dx = 0, dy = 0;
  
  for (const p of platforms) {
    const platformAABB = colliderToAABB(p.collider);
    
    if (isOnTop(playerAABB, platformAABB)) {
      dx += p.lastDX;
      dy += p.lastDY;
    }
  }
  
  return { dx, dy };
}
