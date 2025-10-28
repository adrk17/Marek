import type { Player } from '../entities/Player';
import type { Collider } from '../engine/physics';
import { ColliderType } from '../engine/collision';

export interface GoalHit {
  collider: Collider;
  poleX: number;
  bottomY: number;
  topY: number;
  contactY: number;
  ratio: number; // 0..1 where 1 is top
}

export function detectGoalHit(colliders: Collider[], player: Player): GoalHit | null {
  const a = player.getAABB();
  for (const c of colliders) {
    if (c.colliderType !== ColliderType.TRIGGER || c.type !== 'goal') continue;
    const b = { x: c.pos.x, y: c.pos.y, z: c.pos.z, w: c.size.x, h: c.size.y, d: c.size.z };
    const overlap = Math.abs(a.x - b.x) * 2 < (a.w + b.w) &&
                    Math.abs(a.y - b.y) * 2 < (a.h + b.h) &&
                    Math.abs(a.z - b.z) * 2 < (a.d + b.d);
    if (!overlap) continue;
    const bottomY = c.pos.y - c.size.y / 2;
    const topY = c.pos.y + c.size.y / 2;
    const contactY = Math.max(bottomY, Math.min(a.y, topY));
    const ratio = (contactY - bottomY) / (topY - bottomY);
    return {
      collider: c,
      poleX: c.pos.x,
      bottomY,
      topY,
      contactY,
      ratio
    };
  }
  return null;
}

