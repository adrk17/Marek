import { setTranslation } from '../../engine/x3d';

export type DeathPhase = 'freeze' | 'toss';

export interface DeathAnimationParams {
  freezeDuration: number;
  horizontalFactor: number; // factor * maxSpeed -> initial vx
  verticalFactor: number;   // factor * jumpForce -> initial vy
  zSpeed: number;           // constant z velocity towards camera
  rotSpeed: number;         // radians per second
  maxScale: number;         // max visual scale
  scaleRate: number;        // scale growth per second
  damping: number;          // horizontal damping per second
}

export class DeathAnimation {
  private active = false;
  private phase: DeathPhase = 'freeze';
  private freezeTimer = 0;
  private vel = { x: 0, y: 0, z: 0 };
  private z = 0;
  private rot = 0;
  private rotSpeed = 0;
  private scale = 1;
  private params: DeathAnimationParams;

  constructor(params: DeathAnimationParams) {
    this.params = params;
  }

  isActive(): boolean { return this.active; }

  reset(): void {
    this.active = false;
    this.phase = 'freeze';
    this.freezeTimer = 0;
    this.vel = { x: 0, y: 0, z: 0 };
    this.z = 0;
    this.rot = 0;
    this.rotSpeed = 0;
    this.scale = 1;
  }

  start(initialDirX: number, maxSpeed: number, jumpForce: number): void {
    this.active = true;
    this.phase = 'freeze';
    this.freezeTimer = this.params.freezeDuration;
    this.vel = { x: 0, y: 0, z: 0 };
    this.z = 0;
    this.rot = 0;
    this.rotSpeed = 0;
    this.scale = 1;

    // After freeze we'll initialize toss using direction info
    const dir = initialDirX === 0 ? 1 : Math.sign(initialDirX);
    // Store in vel.x as a marker so we know intended direction when freeze ends
    this.vel.x = dir * (maxSpeed * this.params.horizontalFactor);
    this.vel.y = jumpForce * this.params.verticalFactor;
    this.vel.z = this.params.zSpeed;
    this.rotSpeed = this.params.rotSpeed;
  }

  update(deltaTime: number, gravity: number, position: { x: number; y: number }): void {
    if (!this.active) return;

    if (this.phase === 'freeze') {
      this.freezeTimer -= deltaTime;
      if (this.freezeTimer <= 0) {
        this.phase = 'toss';
      }
      return;
    }

    // Physics integration for toss phase
    this.vel.y += gravity * deltaTime;
    this.vel.x *= Math.max(0, 1 - this.params.damping * deltaTime);

    position.x += this.vel.x * deltaTime;
    position.y += this.vel.y * deltaTime;
    this.z += this.vel.z * deltaTime;

    this.rot += this.rotSpeed * deltaTime;
    this.scale = Math.min(this.params.maxScale, this.scale + this.params.scaleRate * deltaTime);
  }

  apply(node: Element, position: { x: number; y: number }): void {
    if (!this.active) return;
    setTranslation(node, position.x, position.y, this.z);
    node.setAttribute('rotation', `0 0 1 ${this.rot.toFixed(3)}`);
    node.setAttribute('scale', `${this.scale.toFixed(3)} ${this.scale.toFixed(3)} ${this.scale.toFixed(3)}`);
  }
}

