import type { AABB, Vec3 } from './types';
import { ColliderType } from './collision';

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return Math.abs(a.x - b.x) * 2 < (a.w + b.w) &&
         Math.abs(a.y - b.y) * 2 < (a.h + b.h) &&
         Math.abs(a.z - b.z) * 2 < (a.d + b.d);
}


export interface Collider {
  pos: Vec3;
  size: Vec3;
  type?: string;
  node?: Element;
  colliderType?: ColliderType;
  // Optional motion for moving platforms or similar
  motion?: { axis: 'x' | 'y'; amplitude: number; speed: number; phase: number };
  // Endless elevator platforms parameters
  endless?: { group: string; speed: number; spacing: number; bottomY: number };
}

export function resolveEntity(
  next: { x: number; y: number; z: number },
  playerSize: { x: number; y: number; z: number },
  v: { x: number; y: number; z: number },
  colliders: Collider[]
) {
  let onGround = false, hitHead = false;
  const a: AABB = { x: next.x, y: next.y, z: next.z, w: playerSize.x, h: playerSize.y, d: playerSize.z };
  
  for (const c of colliders) {
    if (c.colliderType === ColliderType.TRIGGER) continue;
    
    const b: AABB = { x: c.pos.x, y: c.pos.y, z: c.pos.z, w: c.size.x, h: c.size.y, d: c.size.z };
    if (!aabbOverlap(a, b)) continue;

    const dxR = (b.x + b.w / 2) - (a.x - a.w / 2);
    const dxL = (a.x + a.w / 2) - (b.x - b.w / 2);
    const dyT = (b.y + b.h / 2) - (a.y - a.h / 2);
    const dyB = (a.y + a.h / 2) - (b.y - b.h / 2);

    // Check Z-axis penetration
    const dzF = (b.z + b.d / 2) - (a.z - a.d / 2); // front collision
    const dzB = (a.z + a.d / 2) - (b.z - b.d / 2); // back collision
    const minPenetrationZ = Math.min(dzF, dzB);

    if (dyT > 0 && dyT < dyB && dyT <= Math.min(dxR, dxL) && dyT <= minPenetrationZ) {
      next.y += dyT;
      if (v.y <= 0) { // only set onGround and v.y = 0 if falling down (prevents sticking to the platform when colliding from the side
        v.y = 0;
        onGround = true;
      }
      a.y = next.y;
    } else if (dyB > 0 && dyB <= Math.min(dxR, dxL) && dyB <= minPenetrationZ) {
      next.y -= dyB;
      v.y = Math.min(0, v.y);
      hitHead = true;
      a.y = next.y;
    } else if (dzF > 0 && dzF < dzB && dzF <= Math.min(dxR, dxL, dyT, dyB)) {
      // Front Z collision (moving backward into obstacle)
      next.z += dzF;
      v.z = Math.max(0, v.z);
      a.z = next.z;
    } else if (dzB > 0 && dzB <= Math.min(dxR, dxL, dyT, dyB)) {
      // Back Z collision (moving forward into obstacle)
      next.z -= dzB;
      v.z = Math.min(0, v.z);
      a.z = next.z;
    } else {
      // Side collision: resolve based on relative centers to avoid "teleporting"
      // If the entity's center is left of the collider's center, keep it on the left side, and vice versa.
      const entityLeftOfCollider = a.x < b.x;
      if (entityLeftOfCollider) {
        next.x -= dxL; // place player's right edge at collider's left edge
        v.x = Math.min(0, v.x);
        a.x = next.x;
      } else {
        next.x += dxR; // place player's left edge at collider's right edge
        v.x = Math.max(0, v.x);
        a.x = next.x;
      }
    }
  }
  
  return { next, onGround, hitHead };
}
