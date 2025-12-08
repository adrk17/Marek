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
  deathAnimation?: PlayerDeathAnimationConfig;
}

export interface CameraConfig {
  offsetY: number;
  offsetZ: number;
  rotation: number;
  fieldOfView: number;
  smoothing?: number;
  minX?: number;
  maxX?: number;
  offsetX?: number;
  lookAheadFactor?: number;
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
  shellSpeed?: number;
}

export interface ActivationConfig {
  // Only entities within this radius from the player are updated
  enemyUpdateRadius: number;
  // Slightly larger radius used for player-enemy collision checks to avoid edge popping
  enemyCollisionRadius?: number;
}

export interface GoalConfig {
  poleSlideSpeed: number; // units per second
  poleBonusMin: number;   // points for bottom
  poleBonusMax: number;   // points for top
  timeBonusPerSecond: number; // points awarded for each second saved (inverse bonus)
  timeBonusCap?: number; // optional max time bonus
  reloadDelay: number;    // seconds after finish before reload
}

export interface MovingPlatformsConfig {
  enabled: boolean;
  // default oscillation params if level doesn't override
  defaultAmplitude: number; // units
  defaultSpeed: number;     // units/sec
}

export interface EndlessPlatformsConfig {
  enabled: boolean;
  defaultSpeed: number;   // units/sec, positive values move downward by default
  defaultSpacing: number; // vertical gap between platforms in group
}

export interface DebugConfig {
  showColliders: boolean;      // Show wireframe collider boxes
  colliderColor: string;       // RGB color for collider wireframes (e.g. "0 1 0" for green)
  colliderOpacity: number;     // 0-1, transparency of collider visualization
}

export interface GameConfig {
  player: PlayerConfig;
  camera: CameraConfig;
  controls: ControlsConfig;
  physics: PhysicsConfig;
  skybox: SkyboxConfig;
  coin: CoinConfig;
  enemy: EnemyConfig;
  activation: ActivationConfig;
  goal: GoalConfig;
  movingPlatforms: MovingPlatformsConfig;
  endlessPlatforms: EndlessPlatformsConfig;
  debug: DebugConfig;
}

export interface PlayerDeathAnimationConfig {
  freezeDuration: number;
  horizontalFactor: number;
  verticalFactor: number;
  zSpeed: number;
  rotSpeed: number;
  maxScale: number;
  scaleRate: number;
  damping: number;
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
    deathAnimationDuration: 2,
    deathAnimation: {
      freezeDuration: 1,
      horizontalFactor: 0.6,
      verticalFactor: 1.1,
      zSpeed: 6,
      rotSpeed: 5,
      maxScale: 1.3,
      scaleRate: 0.2,
      damping: 1.5
    }
  },
  camera: {
    offsetY: 6.5,
    offsetZ: 16,
    rotation: 0.2,
    fieldOfView: 0.785,
    smoothing: 0.4,
    minX: -4,
    offsetX: 6,
    
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
    textureUrl: '/textures/1/background 2/orig_big.png',  // Optional texture path
    fallbackColor: "0.56 0.83 1.0", 
    radius: 800
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
  },
  activation: {
    enemyUpdateRadius: 24,
    enemyCollisionRadius: 26
  },
  goal: {
    poleSlideSpeed: 3.5,
    poleBonusMin: 100,
    poleBonusMax: 1000,
    timeBonusPerSecond: 5,
    timeBonusCap: 5000,
    reloadDelay: 2
  },
  movingPlatforms: {
    enabled: true,
    defaultAmplitude: 2,
    defaultSpeed: 0.6
  },
  endlessPlatforms: {
    enabled: true,
    defaultSpeed: 1.2,
    defaultSpacing: 2.5
  },
  debug: {
    showColliders: true,     // Set to true to show wireframe collider boxes
    colliderColor: '0 1 0',   // Green wireframe
    colliderOpacity: 0.3
  }
};

export function createConfig(overrides?: Partial<GameConfig>): GameConfig {
  return {
    player: { 
      ...DEFAULT_CONFIG.player, 
      ...overrides?.player,
      size: { ...DEFAULT_CONFIG.player.size, ...overrides?.player?.size },
      startPosition: { ...DEFAULT_CONFIG.player.startPosition, ...overrides?.player?.startPosition },
      deathAnimation: { ...DEFAULT_CONFIG.player.deathAnimation!, ...overrides?.player?.deathAnimation }
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
    },
    activation: { ...DEFAULT_CONFIG.activation, ...(overrides as any)?.activation }
    ,goal: { ...DEFAULT_CONFIG.goal, ...(overrides as any)?.goal }
    ,movingPlatforms: { ...DEFAULT_CONFIG.movingPlatforms, ...(overrides as any)?.movingPlatforms }
    ,endlessPlatforms: { ...DEFAULT_CONFIG.endlessPlatforms, ...(overrides as any)?.endlessPlatforms }
    ,debug: { ...DEFAULT_CONFIG.debug, ...(overrides as any)?.debug }
  };
}
