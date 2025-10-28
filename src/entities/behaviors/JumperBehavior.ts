import type { Enemy } from '../Enemy';
import type { EnemyBehavior } from './EnemyBehavior';
import { PatrolBehavior } from './PatrolBehavior';
import type { ICollidable } from '../../engine/collision';

export class JumperBehavior implements EnemyBehavior {
  private patrol: PatrolBehavior;
  private jumpTimer = 0;
  private interval: number;
  private force: number;

  constructor(private host: Enemy, interval?: number, force?: number) {
    this.patrol = new PatrolBehavior(host);
    const cfg = host.getConfig();
    this.interval = interval ?? 2;
    this.force = force ?? (cfg as any).jumpForce ?? 8;
  }

  update(deltaTime: number): void {
    this.patrol.update(deltaTime);
    this.jumpTimer += deltaTime;
    if (this.jumpTimer >= this.interval && this.host.getGrounded()) {
      this.host.setVelocityY(this.force);
      this.jumpTimer = 0;
    }
  }

  onWallBlocked(): void {
    this.patrol.onWallBlocked();
  }

  onEnemyCollision(other: Enemy): boolean {
    return this.patrol.onEnemyCollision(other);
  }

  checkStomp(player: ICollidable, playerVelocityY: number): boolean {
    return this.patrol.checkStomp(player, playerVelocityY);
  }

  damagesPlayer(player: ICollidable): boolean {
    return this.patrol.damagesPlayer(player);
  }

  isLethalToEnemies(): boolean { return false; }
}
