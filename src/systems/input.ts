import { Input } from '../engine/input';

export interface Intent {
  axisX: number;
  jump: boolean;
}

export function getIntent(input: Input, grounded: boolean): Intent {
  return {
    axisX: input.axisX(),
    jump: input.jumpPressed(grounded)
  };
}

