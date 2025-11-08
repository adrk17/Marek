import type { Enemy } from '../Enemy';
import type { EnemyBehavior } from './EnemyBehavior';
import type { ICollidable } from '../../engine/collision';
import { checkAABBCollision, isOnTop } from '../../engine/collision';

export class PatrolBehavior implements EnemyBehavior {
  constructor(private host: Enemy) {}

  update(deltaTime: number): void {
    const startX = this.host.getStartX();
    const pos = this.host.getPosition();
    const cfg = this.host.getConfig();
    if (Math.abs(pos.x - startX) > cfg.patrolDistance) {
      this.host.reverseDirection();
      this.host.setVelocityX(cfg.speed * this.host.getDirection());
    }
  }

  onWallBlocked(): void {
    const cfg = this.host.getConfig();
    this.host.reverseDirection();
    this.host.setVelocityX(cfg.speed * this.host.getDirection());
  }

  onEnemyCollision(other: Enemy): boolean {
    // Default: reverse both and resolve overlap proportionally
    const cfg = this.host.getConfig();
    this.host.reverseDirection();
    this.host.setVelocityX(cfg.speed * this.host.getDirection());
    other.reverseDirection();
    
    // Compute overlap on X and split push
    const a = this.host.getAABB();
    const b = other.getAABB();
    const dx = a.x - b.x;
    const halfSum = (a.w + b.w) / 2;
    const overlap = Math.max(0, halfSum - Math.abs(dx));
    
    if (overlap > 0) {
      const sign = dx === 0 ? 1 : Math.sign(dx);
      const push = (overlap / 2) + 0.01;
      this.host.nudgeX(sign * push);
      other.nudgeX(-sign * push);
    }
    return true;
  }

  checkStomp(player: ICollidable, playerVelocityY: number): boolean {
    // Default stomp defeats enemy if player is falling and on top
    if (!this.host.isAlive() || this.host.isStomped()) return false;
    
    const pAABB = player.getAABB();
    const eAABB = this.host.getAABB();
    
    // Player must be falling
    if (playerVelocityY >= 0) return false;
    
    if (isOnTop(pAABB, eAABB, 0.3)) {
      this.host.defeat();
      return true;
    }
    
    return false;
  }

  damagesPlayer(player: ICollidable): boolean {
    if (!this.host.isAlive() || this.host.isStomped()) return false;
    
    return checkAABBCollision(player.getAABB(), this.host.getAABB());
  }

  isLethalToEnemies(): boolean { return false; }
}
