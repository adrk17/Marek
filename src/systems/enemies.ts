import type { Collider } from '../engine/physics';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

export function updateEnemies(enemies: Enemy[], deltaTime: number, colliders: Collider[]): void {
  for (const enemy of enemies) {
    enemy.update(deltaTime, colliders, enemies);
  }
}

export function cullFallen(enemies: Enemy[], deathHeight: number): Enemy[] {
  for (const enemy of enemies) {
    const pos = enemy.getPosition();
    if (pos.y < deathHeight) {
      enemy.die();
    }
  }
  return enemies.filter(e => e.getAlive());
}

export function handleEnemyCollisions(enemies: Enemy[], player: Player): void {
  const playerVel = player.getVelocity();
  for (const enemy of enemies) {
    if (!enemy.isAlive()) continue;
    if (enemy.checkStomp(player, playerVel.y)) {
      player.stompBounce();
      continue;
    }
    if (enemy.damagesPlayer(player)) {
      player.takeDamage();
    }
  }
}

