import type { AABB } from './types';

// ============================================================================
// Collider types
// ============================================================================

export enum ColliderType {
  SOLID = 'solid',
  TRIGGER = 'trigger'
}

// ============================================================================
// Collidable interfaces
// ============================================================================

export interface ICollidable {
  getAABB(): AABB;
  getType(): string;
  getColliderType(): ColliderType;
}

export interface ICollectible extends ICollidable {
  tryCollect(collector: ICollidable): number;
  isTaken(): boolean;
  reset(): void;
}

// ============================================================================
// Collision detection functions
// ============================================================================

/**
 * Check if two AABBs overlap (3D collision detection)
 * This is the canonical AABB collision function - use this everywhere
 */
export function checkAABBCollision(a: AABB, b: AABB): boolean {
  return Math.abs(a.x - b.x) * 2 < (a.w + b.w) &&
         Math.abs(a.y - b.y) * 2 < (a.h + b.h) &&
         Math.abs(a.z - b.z) * 2 < (a.d + b.d);
}

/**
 * Check if two AABBs overlap only in XZ plane (horizontal overlap)
 * Useful for checking if entity is "above" platform
 */
export function checkHorizontalOverlap(a: AABB, b: AABB): boolean {
  return Math.abs(a.x - b.x) * 2 < (a.w + b.w) &&
         Math.abs(a.z - b.z) * 2 < (a.d + b.d);
}

/**
 * Check if entity A is on top of entity B
 * @param tolerance - maximum gap between bottom of A and top of B
 */
export function isOnTop(a: AABB, b: AABB, tolerance: number = 0.12): boolean {
  // Must have horizontal overlap
  if (!checkHorizontalOverlap(a, b)) return false;
  
  // A's center must be above B's center
  if (a.y < b.y) return false;
  
  // Check if bottom of A is close to top of B
  const aBottom = a.y - a.h / 2;
  const bTop = b.y + b.h / 2;
  const gap = Math.abs(aBottom - bTop);
  
  return gap <= tolerance;
}

