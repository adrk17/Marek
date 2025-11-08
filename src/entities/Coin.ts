import type { AABB, Vec3 } from '../engine/types';
import { createAABB } from '../engine/types';
import type { CoinConfig } from '../config/GameConfig';
import { type ICollidable, type ICollectible, ColliderType, checkAABBCollision } from '../engine/collision';

export class Coin implements ICollectible {
  private size: Vec3;
  private position: Vec3;
  private taken: boolean = false;
  private value: number;

  constructor(private node: Element, config: CoinConfig) {
    this.size = { x: config.size, y: config.size, z: config.size };
    this.value = config.value;
    
    const positionStr: string = this.node.getAttribute('translation') || '0 0 0';
    const [x, y, z]: number[] = positionStr.split(' ').map(Number);
    this.position = { x, y, z };
  }

  tryCollect(collector: ICollidable): number {
    if (this.taken) return 0;

    if (checkAABBCollision(this.getAABB(), collector.getAABB())) {
      this.taken = true;
      this.node.setAttribute('render', 'false');
      return this.value;
    }

    return 0;
  }

  getAABB(): AABB {
    return createAABB(this.position, this.size);
  }

  getType(): string {
    return 'coin';
  }

  getColliderType(): ColliderType {
    return ColliderType.TRIGGER;
  }

  isTaken(): boolean {
    return this.taken;
  }

  getValue(): number {
    return this.value;
  }

  reset(): void {
    this.taken = false;
    this.node.setAttribute('render', 'true');
  }
}
