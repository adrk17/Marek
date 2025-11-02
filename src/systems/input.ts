import { Input } from '../engine/input';

export interface Intent {
  axisX: number;
  axisZ: number;
  jump: boolean;
}

export function getIntent(input: Input, grounded: boolean): Intent {
  return {
    axisX: input.axisX(),
    axisZ: input.axisZ(),
    jump: input.jumpPressed(grounded)
  };
}

