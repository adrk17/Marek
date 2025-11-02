import type { CameraConfig } from '../config/GameConfig';

export class Camera {
  private node: Element;
  private config: CameraConfig;
  private currentX: number;
  private currentY: number;
  private smoothing: number;
  private minX?: number;
  private maxX?: number;

  constructor(nodeId: string = 'cam', config: CameraConfig) {
    const element: Element | null = document.getElementById(nodeId);
    if (!element) throw new Error(`Camera node with id '${nodeId}' not found`);

    this.node = element;
    this.config = config;
    this.smoothing = config.smoothing ?? 0.15;

    this.currentX = this.config.offsetX ?? 0;
    this.currentY = this.config.offsetY ?? 0;
    this.minX = config.minX;
    this.maxX = config.maxX;

    this.node.setAttribute('orientation', `-1 0 0 ${config.rotation}`);
    this.node.setAttribute('fieldOfView', config.fieldOfView.toString());
    this.node.setAttribute('position', `${this.currentX.toFixed(3)} ${this.currentY} ${this.config.offsetZ}`);
  }

  followTarget(targetX: number, targetY?: number, targetZ?: number, _targetVelX?: number): void {
    const targetYFinal: number = targetY !== undefined ? targetY + this.config.offsetY : this.config.offsetY;

    const offsetX = this.config.offsetX ?? 0;
    let desiredX = targetX + offsetX;
    if (this.minX !== undefined && desiredX < this.minX) desiredX = this.minX;
    if (this.maxX !== undefined && desiredX > this.maxX) desiredX = this.maxX;

    this.currentX += (desiredX - this.currentX) * this.smoothing;

    if (this.minX !== undefined && this.currentX < this.minX) this.currentX = this.minX;
    if (this.maxX !== undefined && this.currentX > this.maxX) this.currentX = this.maxX;
    this.currentY += (targetYFinal - this.currentY) * this.smoothing;

    // Follow Z position too (for 2.5D movement)
    const targetZFinal = (targetZ ?? 0) + this.config.offsetZ;
    const position: string = `${this.currentX.toFixed(3)} ${this.currentY.toFixed(3)} ${targetZFinal.toFixed(3)}`;
    this.node.setAttribute('position', position);
  }

  setRotation(rotation: number): void {
    this.config.rotation = rotation;
    this.node.setAttribute('orientation', `-1 0 0 ${rotation}`);
  }

  setFieldOfView(fov: number): void {
    this.config.fieldOfView = fov;
    this.node.setAttribute('fieldOfView', fov.toString());
  }

  setBounds(minX?: number, maxX?: number): void {
    this.minX = minX;
    this.maxX = maxX;
  }

  getConfig(): CameraConfig {
    return { ...this.config };
  }
}
