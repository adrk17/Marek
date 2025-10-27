import type { Coin } from '../entities/Coin';
import type { Player } from '../entities/Player';

export function collectCoins(coins: Coin[], player: Player): number {
  let total = 0;
  for (const coin of coins) {
    total += coin.tryCollect(player);
  }
  return total;
}

