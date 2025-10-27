import type { ControlsConfig } from '../config/GameConfig';

export class Input {
  private keys = new Set<string>();
  private keyCodes = new Set<string>();
  private controls: ControlsConfig;
  
  constructor(controls: ControlsConfig) {
    this.controls = controls;
    
    addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.shouldPreventDefault(e.key)) {
        e.preventDefault();
      }
      this.keys.add(e.key);
      this.keyCodes.add(e.code);
    });
    
    addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.delete(e.key);
      this.keyCodes.delete(e.code);
    });
  }
  
  private shouldPreventDefault(key: string): boolean {
    return key === this.controls.left || 
           key === this.controls.right || 
           key === this.controls.jump ||
           key === this.controls.pause ||
           key === this.controls.up ||
           key === this.controls.down;
  }
  
  axisX(): number {
    return (this.keys.has(this.controls.right) ? 1 : 0) - 
           (this.keys.has(this.controls.left) ? 1 : 0);
  }
  
  axisY(): number {
    const up: number = this.controls.up && this.keys.has(this.controls.up) ? 1 : 0;
    const down: number = this.controls.down && this.keys.has(this.controls.down) ? 1 : 0;
    return up - down;
  }
  
  jumpPressed(onGround: boolean): boolean {
    return onGround && this.keys.has(this.controls.jump);
  }

  pausePressed(): boolean {
    const pressed = this.keys.has(this.controls.pause);
    if (pressed) {
      this.keys.delete(this.controls.pause);
    }
    return pressed;
  }
  
  isKeyPressed(key: string): boolean {
    const pressed = this.keys.has(key) || this.keyCodes.has(key);
    if (pressed) {
      this.keys.delete(key);
      this.keyCodes.delete(key);
    }
    return pressed;
  }
  
  getControls(): ControlsConfig {
    return { ...this.controls };
  }
}
