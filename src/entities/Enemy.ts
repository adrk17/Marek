import { resolveEntity, type Collider } from '../engine/physics';
import { setTranslation } from '../engine/x3d';
import type { AABB, Vec2, Vec3 } from '../engine/types';
import type { PhysicsConfig } from '../config/GameConfig';
import { type ICollidable, ColliderType } from '../engine/collision';

export type EnemyBehaviorType = 'grzegorz' | 'kacper' | 'pawel_jumper' //| 'cezary';

export interface EnemyConfig {
  size: { width: number; height: number; depth: number };
  speed: number;
  patrolDistance: number;
  behaviorType?: EnemyBehaviorType;
  jumpInterval?: number;
  jumpForce?: number;
}

/**
 * Enemy with multiple behavior types:
 * - grzegorz: Simple patrol (brown)
 * - kacper: Fast patrol (green)
 * - pawel_jumper: Patrol + periodic jumps (orange)
 * - cezary: Follows player when nearby (purple)
 */
export class Enemy implements ICollidable {
  private node: Element;
  private size: Vec3;
  private position: Vec2;
  private velocity: Vec2 = { x: 0, y: 0 };
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

  constructor(
    nodeId: string,
    startPosition: { x: number; y: number },
    config: EnemyConfig,
    physics: PhysicsConfig
  ) {
    const element: Element | null = document.getElementById(nodeId);
    if (!element) throw new Error(`Enemy '${nodeId}' not found`);
    
    this.node = element;
    this.config = config;
    this.physics = physics;
  this.size = { x: config.size.width, y: config.size.height, z: config.size.depth };
  this.position = { x: startPosition.x, y: startPosition.y };
    this.startX = startPosition.x;
    this.startY = startPosition.y;
    this.behaviorType = config.behaviorType || 'grzegorz';
    this.velocity.x = config.speed * this.direction;
  }

  update(deltaTime: number, colliders: Collider[], otherEnemies?: Enemy[], playerPosition?: { x: number; y: number }): void {
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
        y: this.position.y + this.velocity.y * deltaTime
      };

      // Still collide with platforms/ground
      const resolved = resolveEntity(next, this.size, this.velocity, colliders);
      this.position = resolved.next;
      this.grounded = resolved.onGround;

      // Set translation with visual offset for stomped enemies
      setTranslation(this.node, this.position.x, this.position.y - this.visualOffsetY, 0);
      return;
    }

    // Execute AI based on behavior type
    switch (this.behaviorType) {
      case 'pawel_jumper': this.updateJumpingAI(deltaTime); break;
      //case 'cezary': this.updateChaserAI(deltaTime, playerPosition); break;
      default: this.updatePatrolAI(deltaTime);
    }

    // Apply physics (gravity always applies)
    this.velocity.y += this.physics.gravity * deltaTime;
    if (this.velocity.y < this.physics.maxFallSpeed) {
      this.velocity.y = this.physics.maxFallSpeed;
    }

    const next = {
      x: this.position.x + this.velocity.x * deltaTime,
      y: this.position.y + this.velocity.y * deltaTime
    };

    const resolved = resolveEntity(next, this.size, this.velocity, colliders);
    this.position = resolved.next;
    this.grounded = resolved.onGround;
    
    // Check collision with walls (velocity.x becomes 0)
    if (this.velocity.x === 0) {
      this.direction *= -1;
      this.velocity.x = this.config.speed * this.direction;
    }

    // Check collisions with other enemies
    if (otherEnemies) {
      for (const other of otherEnemies) {
        if (other !== this && !other.isStomped() && this.checkEnemyCollision(other)) {
          // Reverse both enemies' directions
          this.direction *= -1;
          this.velocity.x = this.config.speed * this.direction;
          other.reverseDirection();
        }
      }
    }

    setTranslation(this.node, this.position.x, this.position.y, 0);
  }

  private updatePatrolAI(deltaTime: number): void {
    if (Math.abs(this.position.x - this.startX) > this.config.patrolDistance) {
      this.direction *= -1;
      this.velocity.x = this.config.speed * this.direction;
    }
  }

  private updateJumpingAI(deltaTime: number): void {
    this.updatePatrolAI(deltaTime);
    this.jumpTimer += deltaTime;
    if (this.jumpTimer >= (this.config.jumpInterval || 2) && this.grounded) {
      this.velocity.y = this.config.jumpForce || 8;
      this.jumpTimer = 0;
    }
  }

//   private updateChaserAI(deltaTime: number, playerPos?: { x: number; y: number }): void {
//     if (!playerPos) {
//       this.updatePatrolAI(deltaTime);
//       return;
//     }
//     const dist = Math.abs(this.position.x - playerPos.x);
//     if (dist < 5) {
//       // Chase player - only change direction if needed
//       const targetDirection = this.position.x < playerPos.x ? 1 : -1;
//       if (this.direction !== targetDirection) {
//         this.changeDirectionTimer += deltaTime;
//         if (this.changeDirectionTimer >= 0.4) {
//           this.direction = targetDirection;
//           this.velocity.x = this.config.speed * 1.5 * this.direction;
//           this.changeDirectionTimer = 0;
//         }
//       } else {
//         this.changeDirectionTimer = 0;
//       }
//     } else {
//       // Return to patrol mode
//       this.updatePatrolAI(deltaTime);
//       this.changeDirectionTimer = 0;
//     }
//   }

  checkStomp(player: ICollidable, playerVelocityY: number): boolean {
    if (!this.alive || this.stomped) return false;
    const pAABB = player.getAABB();
    const eAABB = this.getAABB();
    if (playerVelocityY < 0) {
      const pBottom = pAABB.y - pAABB.h / 2;
      const eTop = eAABB.y + eAABB.h / 2;
      if (Math.abs(pBottom - eTop) < 0.3 &&
          Math.abs(pAABB.x - eAABB.x) < (pAABB.w + eAABB.w) / 2) {
        this.defeat();
        return true;
      }
    }
    return false;
  }

   private shrink(): void {
    // Shrink visually
    this.node.setAttribute('scale', '0.9 0.3 0.9');
    // Calculate how much to move down so bottom stays at same Y
    const originalHeight = this.size.y;
    const newHeight = originalHeight * 0.3;
    this.visualOffsetY = (originalHeight - newHeight) / 2;
  }


  private defeat(): void {
    this.stomped = true;
    this.velocity.x = 0; // Stop horizontal movement

    this.shrink();
  }
  

  isStomped(): boolean {
    return this.stomped;
  }

  private checkEnemyCollision(other: Enemy): boolean {
    const thisAABB = this.getAABB();
    const otherAABB = other.getAABB();
    
    return Math.abs(thisAABB.x - otherAABB.x) * 2 < (thisAABB.w + otherAABB.w) &&
           Math.abs(thisAABB.y - otherAABB.y) * 2 < (thisAABB.h + otherAABB.h) &&
           Math.abs(thisAABB.z - otherAABB.z) * 2 < (thisAABB.d + otherAABB.d);
  }

  reverseDirection(): void {
    this.direction *= -1;
    this.velocity.x = this.config.speed * this.direction;
  }

  damagesPlayer(player: ICollidable): boolean {
    if (!this.alive || this.stomped) return false; // Stomped enemies don't damage
    const pAABB = player.getAABB();
    const eAABB = this.getAABB();
    return Math.abs(pAABB.x - eAABB.x) * 2 < (pAABB.w + eAABB.w) &&
           Math.abs(pAABB.y - eAABB.y) * 2 < (pAABB.h + eAABB.h) &&
           Math.abs(pAABB.z - eAABB.z) * 2 < (pAABB.d + eAABB.d);
  }

  getAABB(): AABB {
    return { x: this.position.x, y: this.position.y, z: 0, w: this.size.x, h: this.size.y, d: this.size.z };
  }

  getType(): string { return 'enemy'; }
  getColliderType(): ColliderType { return ColliderType.SOLID; }
  isAlive(): boolean { return this.alive && !this.stomped; } // Stomped = not alive for game logic
  getVelocity(): Vec2 { return { ...this.velocity }; }
}


