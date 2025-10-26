import type { AABB } from './types';

export enum ColliderType {
  SOLID = 'solid',
  TRIGGER = 'trigger'
}

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

export function checkAABBCollision(a: AABB, b: AABB): boolean {
  return Math.abs(a.x - b.x) * 2 < (a.w + b.w) &&
         Math.abs(a.y - b.y) * 2 < (a.h + b.h) &&
         Math.abs(a.z - b.z) * 2 < (a.d + b.d);
}

export interface CollisionInfo {
  collided: boolean;
  colliderType: ColliderType;
  objectType: string;
  target?: ICollidable;
}
