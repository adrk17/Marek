import type { Player } from '../entities/Player';
import type { Collider } from '../engine/physics';
import { colliderToAABB } from '../engine/physics';
import { checkAABBCollision } from '../engine/collision';

/**
 * Check if player is touching any spike colliders and apply damage
 * Spikes always kill the player on contact (no stomp possible)
 */
export function handleSpikeCollisions(colliders: Collider[], player: Player): void {
  if (player.getIsDead()) return;
  
  const playerAABB = player.getAABB();
  
  for (const c of colliders) {
    if (c.type !== 'spikes') continue;
    
    const spikeAABB = colliderToAABB(c);
    
    if (checkAABBCollision(playerAABB, spikeAABB)) {
      // Spikes always kill - no mercy!
      player.kill();
      return;
    }
  }
}
