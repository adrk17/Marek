import type { Collider } from '../engine/physics';
import { setTranslation } from '../engine/x3d';
import type { EndlessPlatformsConfig } from '../config/GameConfig';

export interface EndlessPlatformState {
  collider: Collider;
  group: string;
  speed: number;
  spacing: number;
  bottomY: number;
  // Track last frame movement to carry player
  lastY?: number;
  lastDY?: number;
}

export function buildEndlessPlatforms(colliders: Collider[], cfg: EndlessPlatformsConfig): EndlessPlatformState[] {
  if (!cfg.enabled) return [];
  const list: EndlessPlatformState[] = [];
  for (const c of colliders) {
    if (c.type !== 'endless_platform') continue;
    const speed = c.endless?.speed ?? cfg.defaultSpeed;
    const spacing = c.endless?.spacing ?? cfg.defaultSpacing;
    const bottomY = c.endless?.bottomY ?? cfg.defaultBottomY;
    const group = c.endless?.group ?? 'default';
    list.push({ collider: c, group, speed, spacing, bottomY, lastY: c.pos.y, lastDY: 0 });
  }
  return list;
}

export function updateEndlessPlatforms(platforms: EndlessPlatformState[], deltaTime: number): void {
  // Move all down
  for (const p of platforms) {
    const oldY = p.collider.pos.y;
    p.collider.pos.y -= p.speed * deltaTime;
    p.lastDY = p.collider.pos.y - oldY;
    p.lastY = p.collider.pos.y;
    if (p.collider.node) setTranslation(p.collider.node, p.collider.pos.x, p.collider.pos.y, p.collider.pos.z);
  }

  // Recycle per group
  const groups = new Map<string, EndlessPlatformState[]>();
  for (const p of platforms) {
    const arr = groups.get(p.group) ?? [];
    arr.push(p);
    groups.set(p.group, arr);
  }
  for (const [, arr] of groups) {
    // find current top among group (top edge y)
    let maxTop = -Infinity;
    for (const p of arr) {
      const top = p.collider.pos.y + p.collider.size.y / 2;
      if (top > maxTop) maxTop = top;
    }
    for (const p of arr) {
      const top = p.collider.pos.y + p.collider.size.y / 2;
      if (top < p.bottomY) {
        // recycle above current top; keep exact spacing (ignore spawnMargin for intra-group gap)
        const newCenterY = maxTop + p.spacing + p.collider.size.y / 2;
        p.collider.pos.y = newCenterY;
        p.lastDY = p.collider.pos.y - (p.lastY ?? newCenterY);
        p.lastY = p.collider.pos.y;
        if (p.collider.node) setTranslation(p.collider.node, p.collider.pos.x, p.collider.pos.y, p.collider.pos.z);
        maxTop = newCenterY + p.collider.size.y / 2;
      }
    }
  }
}

// Compute vertical carry for player standing on endless platforms
export function computeVerticalRideDeltaForPlayer(playerAABB: { x: number; y: number; z: number; w: number; h: number; d: number }, platforms: EndlessPlatformState[]): number {
  const EPS = 0.12;
  let dy = 0;
  for (const p of platforms) {
    const b = { x: p.collider.pos.x, y: p.collider.pos.y, z: p.collider.pos.z, w: p.collider.size.x, h: p.collider.size.y, d: p.collider.size.z };
    const horizOverlap = Math.abs(playerAABB.x - b.x) * 2 <= (playerAABB.w + b.w);
    if (!horizOverlap) continue;
    const playerBottom = playerAABB.y - playerAABB.h / 2;
    const platTop = b.y + b.h / 2;
    if (playerAABB.y < b.y) continue; // ensure player center is above platform center
    const verticalGap = Math.abs(playerBottom - platTop);
    if (verticalGap <= EPS) {
      dy += p.lastDY ?? 0;
    }
  }
  return dy;
}
