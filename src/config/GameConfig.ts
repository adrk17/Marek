export interface PlayerConfig {
  speed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  jumpForce: number;
  size: {
    width: number;
    height: number;
    depth: number;
  };
  startPosition: {
    x: number;
    y: number;
  };
  deathHeight: number;
  deathAnimationDuration: number;
}

export interface CameraConfig {
  offsetY: number;
  offsetZ: number;
  rotation: number;
  fieldOfView: number;
  smoothing?: number;
}

export interface ControlsConfig {
  left: string;
  right: string;
  jump: string;
  pause: string;
  up?: string;
  down?: string;
}

export interface PhysicsConfig {
  gravity: number;
  maxFallSpeed: number;
}

export interface SkyboxConfig {
  textureUrl?: string;
  fallbackColor: string; // RGB format: "r g b"
  radius: number;
}

export interface CoinConfig {
  size: number;
  value: number;
}

export interface EnemyConfig {
  speed: number;
  patrolDistance: number;
  size: {
    width: number;
    height: number;
    depth: number;
  };
}

export interface GameConfig {
  player: PlayerConfig;
  camera: CameraConfig;
  controls: ControlsConfig;
  physics: PhysicsConfig;
  skybox: SkyboxConfig;
  coin: CoinConfig;
  enemy: EnemyConfig;
}

export const DEFAULT_CONFIG: GameConfig = {
  player: {
    speed: 6,
    maxSpeed: 12,          
    acceleration: 50,       
    deceleration: 80,
    jumpForce: 20,         
    size: {
      width: 0.8,
      height: 1.2,          
      depth: 0.8
    },
    startPosition: {
      x: 0,
      y: 1
    },
    deathHeight: -10,     
    deathAnimationDuration: 2 
  },
  camera: {
    offsetY: 4,
    offsetZ: 14,
    rotation: 0.3,
    fieldOfView: 0.785,
    smoothing: 0.1
  },
  controls: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: ' ',
    pause: 'Escape'
  },
  physics: {
    gravity: -60,
    maxFallSpeed: -40
  },
  skybox: {
    textureUrl: undefined,  // Optional texture path
    fallbackColor: "0.12 0.16 0.28", 
    radius: 50
  },
  coin: {
    size: 0.6,
    value: 1
  },
  enemy: {
    speed: 2,
    patrolDistance: 3,
    size: {
      width: 0.8,
      height: 0.8,
      depth: 0.8
    }
  }
};

export function createConfig(overrides?: Partial<GameConfig>): GameConfig {
  return {
    player: { 
      ...DEFAULT_CONFIG.player, 
      ...overrides?.player,
      size: { ...DEFAULT_CONFIG.player.size, ...overrides?.player?.size },
      startPosition: { ...DEFAULT_CONFIG.player.startPosition, ...overrides?.player?.startPosition }
    },
    camera: { ...DEFAULT_CONFIG.camera, ...overrides?.camera },
    controls: { ...DEFAULT_CONFIG.controls, ...overrides?.controls },
    physics: { ...DEFAULT_CONFIG.physics, ...overrides?.physics },
    skybox: { ...DEFAULT_CONFIG.skybox, ...overrides?.skybox },
    coin: { ...DEFAULT_CONFIG.coin, ...overrides?.coin },
    enemy: { 
      ...DEFAULT_CONFIG.enemy, 
      ...overrides?.enemy,
      size: { ...DEFAULT_CONFIG.enemy.size, ...overrides?.enemy?.size }
    }
  };
}
