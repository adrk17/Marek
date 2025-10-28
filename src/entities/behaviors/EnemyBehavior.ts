import type { ICollidable } from '../../engine/collision';
import type { Enemy } from '../Enemy';

export interface EnemyBehavior {
  update(deltaTime: number): void;
  onWallBlocked(): void;
  onEnemyCollision(other: Enemy): boolean; // true if handled specially
  checkStomp(player: ICollidable, playerVelocityY: number): boolean;
  damagesPlayer(player: ICollidable): boolean;
  // When true, this enemy should instantly defeat other enemies on contact (e.g., moving turtle shell)
  isLethalToEnemies?(): boolean;
}
