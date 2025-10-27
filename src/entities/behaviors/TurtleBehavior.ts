import type { Enemy } from '../Enemy';
import type { EnemyBehavior } from './EnemyBehavior';
import type { ICollidable } from '../../engine/collision';

type TurtleState = 'walking' | 'shell_stationary' | 'shell_moving';

export class TurtleBehavior implements EnemyBehavior {
  private state: TurtleState = 'walking';
  private shellSpeed: number;
  private afterKickCooldown: number = 0; // grace period after kick

  constructor(private host: Enemy, shellSpeed?: number) {
    this.shellSpeed = shellSpeed ?? 14;
  }

  update(deltaTime: number): void {
    // Manage horizontal velocity based on state
    const cfg = this.host.getConfig();
    if (this.afterKickCooldown > 0) {
      this.afterKickCooldown = Math.max(0, this.afterKickCooldown - deltaTime);
    }
    switch (this.state) {
      case 'walking':
        // simple patrol like default
        const startX = this.host.getStartX();
        const pos = this.host.getPosition();
        if (Math.abs(pos.x - startX) > cfg.patrolDistance) {
          this.host.reverseDirection();
          this.host.setVelocityX(cfg.speed * this.host.getDirection());
        }
        break;
      case 'shell_stationary':
        this.host.setVelocityX(0);
        break;
      case 'shell_moving':
        this.host.setVelocityX(this.shellSpeed * this.host.getDirection());
        break;
    }
  }

  onWallBlocked(): void {
    if (this.state === 'walking') {
      const cfg = this.host.getConfig();
      this.host.reverseDirection();
      this.host.setVelocityX(cfg.speed * this.host.getDirection());
    } else if (this.state === 'shell_moving') {
      // Bounce back and keep speed
      this.host.reverseDirection();
      this.host.setVelocityX(this.shellSpeed * this.host.getDirection());
    }
  }

  onEnemyCollision(other: Enemy): boolean {
    if (this.state === 'shell_moving') {
      // Moving shell kills enemies outright
      other.die();
      // ensure shell isn't stuck in overlap with just-dead enemy
      const a = this.host.getAABB();
      const b = other.getAABB();
      const dx = a.x - b.x;
      const sign = dx === 0 ? this.host.getDirection() : Math.sign(dx);
      this.host.nudgeX(sign * 0.05);
      return true;
    }
    // default: reverse both and split overlap
    const cfg = this.host.getConfig();
    this.host.reverseDirection();
    this.host.setVelocityX(cfg.speed * this.host.getDirection());
    other.reverseDirection();
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
    if (!this.host.isAlive() || this.host.isStomped()) return false;
    const pAABB = player.getAABB();
    const eAABB = this.host.getAABB();
    if (playerVelocityY < 0) {
      const pBottom = pAABB.y - pAABB.h / 2;
      const eTop = eAABB.y + eAABB.h / 2;
      if (Math.abs(pBottom - eTop) < 0.3 && Math.abs(pAABB.x - eAABB.x) < (pAABB.w + eAABB.w) / 2) {
        if (this.state === 'walking') {
          this.enterShell();
        } else if (this.state === 'shell_moving') {
          this.stopShell();
        }
        return true;
      }
    }
    return false;
  }

  damagesPlayer(player: ICollidable): boolean {
    if (!this.host.isAlive() || this.host.isStomped()) return false;
    const pAABB = player.getAABB();
    const eAABB = this.host.getAABB();
    const collided = Math.abs(pAABB.x - eAABB.x) * 2 < (pAABB.w + eAABB.w) &&
                     Math.abs(pAABB.y - eAABB.y) * 2 < (pAABB.h + eAABB.h) &&
                     Math.abs(pAABB.z - eAABB.z) * 2 < (pAABB.d + eAABB.d);
    if (!collided) return false;
    if (this.state === 'shell_moving') {
      // Avoid instant self-hit right after kick
      if (this.afterKickCooldown > 0) return false;
      return true;
    }
    if (this.state === 'shell_stationary') {
      const dir = pAABB.x < eAABB.x ? 1 : -1;
      this.kickShell(dir);
      return false;
    }
    return true; // walking hurts
  }

  private enterShell(): void {
    this.state = 'shell_stationary';
    this.host.setVelocityX(0);
    this.host.shrink();
  }
  private stopShell(): void {
    this.state = 'shell_stationary';
    this.host.setVelocityX(0);
  }
  private kickShell(dir: number): void {
    this.state = 'shell_moving';
    this.host.setDirection(dir >= 0 ? 1 : -1);
    this.host.setVelocityX(this.shellSpeed * this.host.getDirection());
    // Nudge shell forward to break any initial overlap with player
    this.host.nudgeX(this.host.getDirection() * 0.2);
    // Slightly longer cooldown to ensure safe separation
    this.afterKickCooldown = 0.4;
  }
}
