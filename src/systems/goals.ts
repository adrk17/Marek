import type { Player } from '../entities/Player';
import type { Collider } from '../engine/physics';
import { colliderToAABB } from '../engine/physics';
import { ColliderType } from '../engine/collision';
import { checkAABBCollision } from '../engine/collision';

export interface GoalHit {
  collider: Collider;
  poleX: number;
  bottomY: number;
  topY: number;
  contactY: number;
  ratio: number; // 0..1 where 1 is top
}

export function detectGoalHit(colliders: Collider[], player: Player): GoalHit | null {
  const playerAABB = player.getAABB();
  
  for (const c of colliders) {
    if (c.colliderType !== ColliderType.TRIGGER || c.type !== 'goal') continue;
    
    const goalAABB = colliderToAABB(c);
    
    if (!checkAABBCollision(playerAABB, goalAABB)) continue;
    
    const bottomY = goalAABB.y - goalAABB.h / 2;
    const topY = goalAABB.y + goalAABB.h / 2;
    const contactY = Math.max(bottomY, Math.min(playerAABB.y, topY));
    const ratio = (contactY - bottomY) / (topY - bottomY);
    
    return {
      collider: c,
      poleX: goalAABB.x,
      bottomY,
      topY,
      contactY,
      ratio
    };
  }
  
  return null;
}

