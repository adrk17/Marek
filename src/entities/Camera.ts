import type { CameraConfig } from '../config/GameConfig';

export class Camera {
  private node: Element;
  private config: CameraConfig;

  constructor(nodeId: string = 'cam', config: CameraConfig) {
    const element: Element | null = document.getElementById(nodeId);
    if (!element) throw new Error(`Camera node with id '${nodeId}' not found`);
    
    this.node = element;
    this.config = config;
    
    this.node.setAttribute('orientation', `-1 0 0 ${config.rotation}`);
    this.node.setAttribute('fieldOfView', config.fieldOfView.toString());
  }

  followTarget(targetX: number, targetY?: number): void {
    const y: number = targetY !== undefined ? targetY + this.config.offsetY : this.config.offsetY;
    const position: string = `${targetX.toFixed(3)} ${y} ${this.config.offsetZ}`;
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

  getConfig(): CameraConfig {
    return { ...this.config };
  }
}
