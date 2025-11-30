import type { AABB, Vec2, Vec3 } from './types';
import { createAABB, aabb } from './types';
import { ColliderType, checkAABBCollision } from './collision';

// ============================================================================
// Collider definition
// ============================================================================

/**
 * Physical collider in the game world
 * Can be static, moving platform, trigger zone, etc.
 */
export interface Collider {
  pos: Vec3;
  size: Vec3;
  type?: string;
  node?: Element;
  colliderType?: ColliderType;
  // Optional motion for moving platforms
  motion?: { 
    axis: 'x' | 'y' | 'z'; 
    amplitude: number; 
    speed: number; 
    phase: number;
  };
  // Endless elevator platforms parameters
  endless?: { 
    group: string; 
    speed: number; 
    spacing: number;
  };
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Convert Collider to AABB for collision detection
 */
export function colliderToAABB(c: Collider): AABB {
  return createAABB(c.pos, c.size);
}

// ============================================================================
// Physics resolution
// ============================================================================

/**
 * Resolve entity movement against colliders
 * Returns adjusted position, ground contact, and head collision status
 */
export function resolveEntity(
  next: Vec2,
  entitySize: Vec3,
  velocity: Vec2,
  colliders: Collider[],
  zProximityThreshold: number = 1.5
) {
  let onGround = false;
  let hitHead = false;
  
  const entityAABB: AABB = aabb(next.x, next.y, 0, entitySize.x, entitySize.y, entitySize.z);
  
  for (const c of colliders) {
    // Skip trigger colliders for physics resolution
    if (c.colliderType === ColliderType.TRIGGER) continue;
    
    const colliderAABB = colliderToAABB(c);
    
    // Check Z-axis proximity - if platform is too far in depth, ignore collision
    const zDistance = Math.abs(entityAABB.z - colliderAABB.z);
    if (zDistance > zProximityThreshold) continue;
    
    if (!checkAABBCollision(entityAABB, colliderAABB)) continue;

    // Calculate penetration depths on all sides
    const dxRight = (colliderAABB.x + colliderAABB.w / 2) - (entityAABB.x - entityAABB.w / 2);
    const dxLeft = (entityAABB.x + entityAABB.w / 2) - (colliderAABB.x - colliderAABB.w / 2);
    const dyTop = (colliderAABB.y + colliderAABB.h / 2) - (entityAABB.y - entityAABB.h / 2);
    const dyBottom = (entityAABB.y + entityAABB.h / 2) - (colliderAABB.y - colliderAABB.h / 2);

    // Resolve collision on the axis with smallest penetration
    if (dyTop > 0 && dyTop < dyBottom && dyTop <= Math.min(dxRight, dxLeft)) {
      // Collision from top (entity lands on collider)
      next.y += dyTop;
      if (velocity.y <= 0) {
        velocity.y = 0;
        onGround = true;
      }
      entityAABB.y = next.y;
    } else if (dyBottom > 0 && dyBottom <= Math.min(dxRight, dxLeft)) {
      // Collision from bottom (entity hits head)
      next.y -= dyBottom;
      velocity.y = Math.min(0, velocity.y);
      hitHead = true;
      entityAABB.y = next.y;
    } else {
      // Side collision: resolve based on relative centers
      const entityLeftOfCollider = entityAABB.x < colliderAABB.x;
      if (entityLeftOfCollider) {
        next.x -= dxLeft;
        velocity.x = Math.min(0, velocity.x);
      } else {
        next.x += dxRight;
        velocity.x = Math.max(0, velocity.x);
      }
      entityAABB.x = next.x;
    }
  }
  
  return { next, onGround, hitHead };
}
