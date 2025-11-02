import type { Collider } from '../engine/physics';
import { setTranslation } from '../engine/x3d';
import type { EndlessPlatformsConfig } from '../config/GameConfig';

export interface EndlessPlatformState {
  collider: Collider;
  group: string;
  speed: number;
  spacing: number;
  initialTop: number;
  initialBottom: number;
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
    const group = c.endless?.group ?? 'default';
    const halfHeight = c.size.y / 2;
    list.push({
      collider: c,
      group,
      speed,
      spacing,
      initialTop: c.pos.y + halfHeight,
      initialBottom: c.pos.y - halfHeight,
      lastY: c.pos.y,
      lastDY: 0
    });
  }
  return list;
}

export function updateEndlessPlatforms(platforms: EndlessPlatformState[], deltaTime: number): void {
  if (!platforms.length) return;

  // Move according to speed (positive speed keeps legacy behaviour: downward)
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
    if (!arr.length) continue;
    const movingDown = (arr[0]?.speed ?? 0) >= 0;
    const initialMinBottom = arr.reduce((min, p) => Math.min(min, p.initialBottom), Infinity);
    const initialMaxTop = arr.reduce((max, p) => Math.max(max, p.initialTop), -Infinity);

    if (movingDown) {
      let maxTopCurrent = arr.reduce(
        (max, p) => Math.max(max, p.collider.pos.y + p.collider.size.y / 2),
        -Infinity
      );
      for (const p of arr) {
        const currentTop = p.collider.pos.y + p.collider.size.y / 2;
        if (currentTop < initialMinBottom) {
          const halfHeight = p.collider.size.y / 2;
          const newCenterY = maxTopCurrent + p.spacing + halfHeight;
          const prevY = p.collider.pos.y;
          p.collider.pos.y = newCenterY;
          p.lastDY = p.collider.pos.y - prevY;
          p.lastY = p.collider.pos.y;
          if (p.collider.node) setTranslation(p.collider.node, p.collider.pos.x, p.collider.pos.y, p.collider.pos.z);
          maxTopCurrent = newCenterY + halfHeight;
        }
      }
    } else {
      let minBottomCurrent = arr.reduce(
        (min, p) => Math.min(min, p.collider.pos.y - p.collider.size.y / 2),
        Infinity
      );
      for (const p of arr) {
        const currentBottom = p.collider.pos.y - p.collider.size.y / 2;
        if (currentBottom > initialMaxTop) {
          const halfHeight = p.collider.size.y / 2;
          const newCenterY = minBottomCurrent - p.spacing - halfHeight;
          const prevY = p.collider.pos.y;
          p.collider.pos.y = newCenterY;
          p.lastDY = p.collider.pos.y - prevY;
          p.lastY = p.collider.pos.y;
          if (p.collider.node) setTranslation(p.collider.node, p.collider.pos.x, p.collider.pos.y, p.collider.pos.z);
          minBottomCurrent = newCenterY - halfHeight;
        }
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
