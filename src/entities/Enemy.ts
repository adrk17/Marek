import { resolveEntity, type Collider } from '../engine/physics';
import { setTranslation } from '../engine/x3d';
import type { AABB, Vec2, Vec3 } from '../engine/types';
import type { PhysicsConfig } from '../config/GameConfig';
import { type ICollidable, ColliderType } from '../engine/collision';
import type { EnemyBehavior } from './behaviors/EnemyBehavior';
import { PatrolBehavior } from './behaviors/PatrolBehavior';
import { JumperBehavior } from './behaviors/JumperBehavior';
import { TurtleBehavior } from './behaviors/TurtleBehavior';

export type EnemyBehaviorType = 'grzegorz' | 'kacper' | 'pawel_jumper' //| 'cezary';

export interface EnemyConfig {
  size: { width: number; height: number; depth: number };
  speed: number;
  patrolDistance: number;
  behaviorType?: EnemyBehaviorType;
  jumpInterval?: number;
  jumpForce?: number;
  shellSpeed?: number;
}

export class Enemy implements ICollidable {
  private node: Element;
  private size: Vec3;
  private position: Vec3;
  private velocity: Vec3 = { x: 0, y: 0, z: 0 };
  private grounded: boolean = false;
  private config: EnemyConfig;
  private physics: PhysicsConfig;
  private startX: number;
  private startY: number;
  private direction: number = 1;
  private alive: boolean = true;
  private behaviorType: EnemyBehaviorType;
  private changeDirectionTimer: number = 0;
  private stomped: boolean = false; // Stomped flat, no more collision
  private visualOffsetY: number = 0; // Additional visual offset for stomped enemies
  private jumpTimer: number = 0;
  private behavior!: EnemyBehavior;

  constructor(
    nodeId: string,
    startPosition: { x: number; y: number; z?: number },
    config: EnemyConfig,
    physics: PhysicsConfig
  ) {
    const element: Element | null = document.getElementById(nodeId);
    if (!element) throw new Error(`Enemy '${nodeId}' not found`);
    
    this.node = element;
    this.config = config;
    this.physics = physics;
    this.size = { x: config.size.width, y: config.size.height, z: config.size.depth };
    this.position = { x: startPosition.x, y: startPosition.y, z: startPosition.z ?? 0 };
    this.startX = startPosition.x;
    this.startY = startPosition.y;
    this.behaviorType = config.behaviorType || 'grzegorz';
    this.velocity.x = config.speed * this.direction;

    switch (this.behaviorType) {
      case 'pawel_jumper':
        this.behavior = new JumperBehavior(this, config.jumpInterval, config.jumpForce);
        break;
      case 'kacper':
        this.behavior = new TurtleBehavior(this, config.shellSpeed);
        break;
      default:
        this.behavior = new PatrolBehavior(this);
    }
  }

  update(deltaTime: number, colliders: Collider[], otherEnemies?: Enemy[]): void {
    if (!this.alive) return;

    // If stomped, only apply physics (no AI)
    if (this.stomped) {
      // Apply gravity
      this.velocity.y += this.physics.gravity * deltaTime;
      if (this.velocity.y < this.physics.maxFallSpeed) {
        this.velocity.y = this.physics.maxFallSpeed;
      }

      const next = {
        x: this.position.x + this.velocity.x * deltaTime,
        y: this.position.y + this.velocity.y * deltaTime,
        z: this.position.z + this.velocity.z * deltaTime
      };

      // Still collide with platforms/ground
      const resolved = resolveEntity(next, this.size, this.velocity, colliders);
      this.position = resolved.next;
      this.grounded = resolved.onGround;

      // Set translation with visual offset for stomped enemies
      setTranslation(this.node, this.position.x, this.position.y - this.visualOffsetY, this.position.z);
      return;
    }

    // Execute AI via behavior
    this.behavior.update(deltaTime);

    // Apply physics (gravity always applies)
    this.velocity.y += this.physics.gravity * deltaTime;
    if (this.velocity.y < this.physics.maxFallSpeed) {
      this.velocity.y = this.physics.maxFallSpeed;
    }

    const next = {
      x: this.position.x + this.velocity.x * deltaTime,
      y: this.position.y + this.velocity.y * deltaTime,
      z: this.position.z + this.velocity.z * deltaTime
    };

    const resolved = resolveEntity(next, this.size, this.velocity, colliders);
    this.position = resolved.next;
    this.grounded = resolved.onGround;
    
    // Check collision with walls (velocity.x becomes 0)
    if (this.velocity.x === 0) {
      this.behavior.onWallBlocked();
    }

    // Check collisions with other enemies
    if (otherEnemies) {
      for (const other of otherEnemies) {
        if (other === this || !other.isAlive() || other.isStomped()) continue;
        if (!this.checkEnemyCollision(other)) continue;

        // Priority: lethal enemies (e.g., moving shell) always defeat the other on contact
        if (typeof other.isLethalToEnemies === 'function' && other.isLethalToEnemies()) {
          this.die();
          continue;
        }
        if (typeof this.isLethalToEnemies === 'function' && this.isLethalToEnemies()) {
          other.die();
          continue;
        }

        if (!this.behavior.onEnemyCollision(other)) {
          this.reverseDirection();
          this.velocity.x = this.config.speed * this.direction;
          other.reverseDirection();
        }
      }
    }

    setTranslation(this.node, this.position.x, this.position.y, this.position.z);
  }

  checkStomp(player: ICollidable, playerVelocityY: number): boolean {
    return this.behavior.checkStomp(player, playerVelocityY);
  }

  public shrink(): void {
    // Shrink visually
    this.node.setAttribute('scale', '0.9 0.3 0.9');
    // Calculate how much to move down so bottom stays at same Y
    const originalHeight = this.size.y;
    const newHeight = originalHeight * 0.3;
    this.visualOffsetY = (originalHeight - newHeight) / 2;
  }


  public defeat(): void {
    this.stomped = true;
    this.velocity.x = 0; // Stop horizontal movement

    this.shrink();
  }
  
  isStomped(): boolean {
    return this.stomped;
  }

  // Public: allow other entities (shell) to squash this enemy
  squash(): void {
    if (!this.stomped) this.defeat();
  }

  getPosition(): Vec3 {
    return { ...this.position };
  }

  getAlive(): boolean {
    return this.alive;
  }

  die(): void {
    if (!this.alive) return;
    this.alive = false;
    // Remove visual node from scene
    const parent = this.node.parentNode;
    if (parent) parent.removeChild(this.node);
  }

  private checkEnemyCollision(other: Enemy): boolean {
    const thisAABB = this.getAABB();
    const otherAABB = other.getAABB();
    
    return Math.abs(thisAABB.x - otherAABB.x) * 2 <= (thisAABB.w + otherAABB.w) &&
           Math.abs(thisAABB.y - otherAABB.y) * 2 <= (thisAABB.h + otherAABB.h) &&
           Math.abs(thisAABB.z - otherAABB.z) * 2 <= (thisAABB.d + otherAABB.d);
  }

  reverseDirection(): void {
    this.direction *= -1;
    this.velocity.x = this.config.speed * this.direction;
  }

  damagesPlayer(player: ICollidable): boolean {
    return this.behavior.damagesPlayer(player);
  }

  getAABB(): AABB {
    return { x: this.position.x, y: this.position.y, z: this.position.z, w: this.size.x, h: this.size.y, d: this.size.z };
  }

  getType(): string { return 'enemy'; }
  getColliderType(): ColliderType { return ColliderType.SOLID; }
  isAlive(): boolean { return this.alive && !this.stomped; }
  getVelocity(): Vec3 { return { ...this.velocity }; }
  isLethalToEnemies(): boolean { return typeof this.behavior.isLethalToEnemies === 'function' ? !!this.behavior.isLethalToEnemies() : false; }

  // Accessors for behaviors
  getDirection(): number { return this.direction; }
  setDirection(dir: number): void { this.direction = dir; }
  setVelocityX(x: number): void { this.velocity.x = x; }
  setVelocityY(y: number): void { this.velocity.y = y; }
  getGrounded(): boolean { return this.grounded; }
  getStartX(): number { return this.startX; }
  getConfig(): EnemyConfig { return this.config; }
  getPhysics(): PhysicsConfig { return this.physics; }
  nudgeX(dx: number): void { this.position.x += dx; }
}


