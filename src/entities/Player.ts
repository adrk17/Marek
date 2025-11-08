import { resolveEntity, type Collider } from '../engine/physics';
import { setTranslation } from '../engine/x3d';
import type { AABB, Vec2, Vec3 } from '../engine/types';
import { createAABB } from '../engine/types';
import type { PlayerConfig, PhysicsConfig } from '../config/GameConfig';
import { type ICollidable, ColliderType } from '../engine/collision';
import { DeathAnimation } from './animation/DeathAnimation';

enum MovementState {
  IDLE,
  MOVING_RIGHT,
  MOVING_LEFT,
  SKIDDING_RIGHT,
  SKIDDING_LEFT
}

export class Player implements ICollidable {
  private node: Element;
  private size: Vec3;
  private position: Vec2;
  private velocity: Vec2 = { x: 0, y: 0 };
  private grounded: boolean = false;
  private config: PlayerConfig;
  private physics: PhysicsConfig;
  private isDead: boolean = false;
  private onDeathCallback?: () => void;
  private movementState: MovementState = MovementState.IDLE;
  private health: number = 1; // Default 1 health
  private invincible: boolean = false;
  private invincibilityTimer: number = 0;
  private invincibilityDuration: number = 1.5; // 1.5 seconds of invincibility after getting hit
  private deathAnim: DeathAnimation;
  // Win animation (goal slide)
  private goalSlideActive: boolean = false;
  private goalSlideBottomY: number = 0;
  private goalSlideSpeed: number = 0;

  constructor(nodeId: string = 'player', config: PlayerConfig, physics: PhysicsConfig) {
    const element: Element | null = document.getElementById(nodeId);
    if (!element) {
      throw new Error(`Player node with id '${nodeId}' not found. Make sure level is loaded first.`);
    }
    
    this.node = element;
    this.config = config;
    this.physics = physics;
    this.size = { x: config.size.width, y: config.size.height, z: config.size.depth };
    this.position = { x: config.startPosition.x, y: config.startPosition.y };
    this.deathAnim = new DeathAnimation(config.deathAnimation!);
  }

  update(deltaTime: number, axisX: number, jump: boolean, colliders: Collider[]): void {
    if (this.deathAnim.isActive() || this.goalSlideActive) {
      return;
    }
    // Update invincibility timer
    if (this.invincible) {
      this.invincibilityTimer -= deltaTime;
      if (this.invincibilityTimer <= 0) {
        this.invincible = false;
      }
    }
    
    // Update movement state based on input
    this.updateMovementState(axisX, deltaTime);
    
    if (jump && this.grounded) {
      this.velocity.y = this.config.jumpForce;
    }
    
    this.velocity.y += this.physics.gravity * deltaTime;
    
    if (this.velocity.y < this.physics.maxFallSpeed) {
      this.velocity.y = this.physics.maxFallSpeed;
    }

    const nextPosition: Vec2 = {
      x: this.position.x + this.velocity.x * deltaTime,
      y: this.position.y + this.velocity.y * deltaTime
    };

    const collision = resolveEntity(nextPosition, this.size, this.velocity, colliders);
    
    this.position = collision.next;
    this.grounded = collision.onGround;

    setTranslation(this.node, this.position.x, this.position.y, 0);
    
    // Check if player fell too low
    if (!this.isDead && this.position.y < this.config.deathHeight) {
      this.isDead = true;
      if (this.onDeathCallback) {
        this.onDeathCallback();
      }
    }
  }

  private updateMovementState(axisX: number, deltaTime: number): void {
    const MIN_VELOCITY = 0.1;
    
    const isStopped = Math.abs(this.velocity.x) <= MIN_VELOCITY;
    
    // Input direction
    const pressingRight = axisX > 0;
    const pressingLeft = axisX < 0;
    const noInput = axisX === 0;
    
    // State machine transitions
    switch (this.movementState) {
      case MovementState.IDLE:
        if (pressingRight) {
          this.movementState = MovementState.MOVING_RIGHT;
        } else if (pressingLeft) {
          this.movementState = MovementState.MOVING_LEFT;
        }
        this.velocity.x = 0;
        break;
        
      case MovementState.MOVING_RIGHT:
        if (pressingLeft) {
          this.velocity.x = 0;
          this.movementState = MovementState.IDLE;
        } else if (noInput) {
          this.movementState = MovementState.SKIDDING_RIGHT;
        } else if (pressingRight) {
          this.accelerate(1, deltaTime);
        }
        break;
        
      case MovementState.MOVING_LEFT:
        if (pressingRight) {
          this.velocity.x = 0;
          this.movementState = MovementState.IDLE;
        } else if (noInput) {
          this.movementState = MovementState.SKIDDING_LEFT;
        } else if (pressingLeft) {
          this.accelerate(-1, deltaTime);
        }
        break;
        
      case MovementState.SKIDDING_RIGHT:
        if (pressingRight) {
          this.movementState = MovementState.MOVING_RIGHT;
        } else if (pressingLeft) {
          this.velocity.x = 0;
          this.movementState = MovementState.IDLE;
        } else {
          this.decelerate(deltaTime);
          if (isStopped) {
            this.movementState = MovementState.IDLE;
          }
        }
        break;
        
      case MovementState.SKIDDING_LEFT:
        if (pressingLeft) {
          this.movementState = MovementState.MOVING_LEFT;
        } else if (pressingRight) {
          this.velocity.x = 0;
          this.movementState = MovementState.IDLE;
        } else {
          this.decelerate(deltaTime);
          if (isStopped) {
            this.movementState = MovementState.IDLE;
          }
        }
        break;
    }
  }

  private accelerate(direction: number, deltaTime: number): void {
    const targetSpeed = direction * this.config.maxSpeed;
    
    if (Math.abs(this.velocity.x) < this.config.maxSpeed) {
      this.velocity.x += direction * this.config.acceleration * deltaTime;
      
      // Clamp to max speed
      if (Math.abs(this.velocity.x) > this.config.maxSpeed) {
        this.velocity.x = targetSpeed;
      }
    }
  }

  private decelerate(deltaTime: number): void {
    const decel = this.config.deceleration * deltaTime;
    
    if (this.velocity.x > 0) {
      this.velocity.x = Math.max(0, this.velocity.x - decel);
    } else if (this.velocity.x < 0) {
      this.velocity.x = Math.min(0, this.velocity.x + decel);
    }
  }

  getAABB(): AABB {
    return createAABB(
      { x: this.position.x, y: this.position.y, z: 0 },
      this.size
    );
  }

  getType(): string {
    return 'player';
  }

  getColliderType(): ColliderType {
    return ColliderType.SOLID;
  }

  getPosition(): Vec2 {
    return { ...this.position };
  }

  getVelocity(): Vec2 {
    return { ...this.velocity };
  }

  isGrounded(): boolean {
    return this.grounded;
  }

  reset(): void {
    this.position = {
      x: this.config.startPosition.x,
      y: this.config.startPosition.y
    };
    this.velocity = { x: 0, y: 0 };
    this.grounded = false;
    this.isDead = false;
    this.health = 1;
    this.invincible = false;
    this.invincibilityTimer = 0;
    this.movementState = MovementState.IDLE;
    this.deathAnim.reset();
    this.node.removeAttribute('rotation');
    this.node.removeAttribute('scale');
    setTranslation(this.node, this.position.x, this.position.y, 0);
  }

  onDeath(callback: () => void): void {
    this.onDeathCallback = callback;
  }

  takeDamage(): void {
    if (this.invincible || this.isDead) return;
    
    this.health--;
    
    if (this.health <= 0) {
      this.kill();
    } else {
      // Start invincibility period
      this.invincible = true;
      this.invincibilityTimer = this.invincibilityDuration;
    }
  }

  // Called when player stomps on enemy - small bounce
  stompBounce(): void {
    this.velocity.y = this.config.jumpForce * 0.6;
  }

  isInvincible(): boolean {
    return this.invincible;
  }

  kill(): void {
    if (!this.isDead) {
      this.isDead = true;
      if (this.onDeathCallback) {
        this.onDeathCallback();
      }
    }
  }

  getIsDead(): boolean {
    return this.isDead;
  }

  startDeathAnimation(): void {
    this.deathAnim.start(this.velocity.x, this.config.maxSpeed, this.config.jumpForce);
  }

  updateDeath(deltaTime: number): void {
    if (!this.deathAnim.isActive()) return;
    this.deathAnim.update(deltaTime, this.physics.gravity, this.position);
    this.deathAnim.apply(this.node, this.position);
  }

  // --- Winning / Goal slide ---
  startGoalSlide(poleX: number, bottomY: number, slideSpeed: number): void {
    this.goalSlideActive = true;
    this.goalSlideBottomY = bottomY;
    this.goalSlideSpeed = Math.max(0, slideSpeed);
    // Snap X to pole, zero velocity
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.position.x = poleX;
    setTranslation(this.node, this.position.x, this.position.y, 0);
  }

  isGoalSliding(): boolean {
    return this.goalSlideActive;
  }

  updateGoalSlide(deltaTime: number): void {
    if (!this.goalSlideActive) return;
    // Move down until bottomY
    const targetY = this.goalSlideBottomY;
    if (this.position.y > targetY) {
      this.position.y = Math.max(targetY, this.position.y - this.goalSlideSpeed * deltaTime);
      setTranslation(this.node, this.position.x, this.position.y, 0);
    }
  }

  stopGoalSlide(): void {
    this.goalSlideActive = false;
  }

  // Move player by external delta (e.g., riding platform)
  applyPlatformDelta(dx: number, dy: number): void {
    if (this.deathAnim.isActive() || this.goalSlideActive) return;
    if (dx === 0 && dy === 0) return;
    this.position.x += dx;
    this.position.y += dy;
    setTranslation(this.node, this.position.x, this.position.y, 0);
  }
}
