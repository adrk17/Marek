import './style.css';
import { Input } from './engine/input';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { Coin } from './entities/Coin';
import { Camera } from './entities/Camera';
import { GameState } from './game/GameState';
import { UIManager } from './game/UIManager';
import { ModelLoader } from './game/ModelLoader';
import { SkyboxManager } from './game/SkyboxManager';
import { DEFAULT_CONFIG, createConfig, type GameConfig } from './config/GameConfig';
import type { Collider } from './engine/physics';
import { updateEnemies as updateEnemiesSys, cullFallen as cullFallenSys, handleEnemyCollisions as handleEnemyCollisionsSys } from './systems/enemies';
import { collectCoins as collectCoinsSys } from './systems/coins';
import { getIntent } from './systems/input';

class Game {
  private input: Input;
  private player!: Player; // Will be initialized after level load
  private camera: Camera;
  private gameState: GameState;
  private uiManager: UIManager;
  private modelLoader: ModelLoader;
  private skyboxManager: SkyboxManager;
  private colliders: Collider[];
  private coins: Coin[];
  private enemies: Enemy[];
  private lastTime: number = 0;
  private config: GameConfig;
  private levelLoaded: boolean = false;

  constructor(config?: Partial<GameConfig>) {
    this.config = config ? createConfig(config) : DEFAULT_CONFIG;
    
    this.input = new Input(this.config.controls);
    this.camera = new Camera('cam', this.config.camera);
    this.gameState = new GameState();
    this.uiManager = new UIManager();
    this.modelLoader = new ModelLoader();
    this.skyboxManager = new SkyboxManager(this.config.skybox);
    
    // Initialize empty arrays - will be populated when level loads
    this.colliders = [];
    this.coins = [];
    this.enemies = [];
    
    // Load level asynchronously, then create player and start game loop
    this.loadLevel('/levels/level1.json').then(() => {
      // Now that level is loaded and player element exists in DOM, create Player instance
      this.player = new Player('player', this.config.player, this.config.physics);
      
      // Setup death callback
      this.player.onDeath(() => this.handlePlayerDeath());
      
      this.levelLoaded = true;
      console.log('Level loaded, player created, starting game loop');
    });
  }

  private async loadLevel(levelUrl: string): Promise<void> {
    try {
      console.log(`Loading level from: ${levelUrl}`);
      const levelData = await this.modelLoader.loadLevelFromFile(levelUrl);
      console.log('Level data loaded:', levelData);
      
      // Load models and get colliders
      this.colliders = this.modelLoader.loadFromJSON(levelData);
      console.log('Colliders created:', this.colliders);
      
      // Create enemy elements in DOM
      if (levelData.enemies && levelData.enemies.length > 0) {
        this.modelLoader.createEnemies(levelData.enemies);
      }
      
      // Extract coins from loaded models (type: 'coin')
      this.coins = levelData.models
        .filter(model => model.type === 'coin')
        .map((model) => {
          const coinElement = document.getElementById(model.id);
          
          if (!coinElement) {
            console.warn(`Coin element not found: ${model.id}`);
            return null;
          }
          
          return new Coin(
            coinElement as Element,
            { 
              size: model.size!.x,
              value: model.value || this.config.coin.value 
            }
          );
        })
        .filter((coin): coin is Coin => coin !== null);
      
      // Create Enemy instances
      this.enemies = (levelData.enemies || []).map((enemyDef) => {
        const enemyElement = document.getElementById(enemyDef.id);
        
        if (!enemyElement) {
          console.warn(`Enemy element not found: ${enemyDef.id}`);
          return null;
        }
        
        return new Enemy(
          enemyDef.id,
          { x: enemyDef.position.x, y: enemyDef.position.y },
          {
            size: { width: 0.8, height: 0.8, depth: 0.8 },
            speed: enemyDef.speed || 2,
            patrolDistance: enemyDef.patrolDistance || 2,
            behaviorType: enemyDef.type || 'grzegorz',
            jumpInterval: enemyDef.jumpInterval,
            jumpForce: enemyDef.jumpForce
          },
          this.config.physics
        );
      }).filter((enemy): enemy is Enemy => enemy !== null);
      
      console.log(`Loaded level: ${levelData.name}`);
      console.log(`- Models: ${this.colliders.length}`);
      console.log(`- Coins: ${this.coins.length}`);
      console.log(`- Enemies: ${this.enemies.length}`);
    } catch (error) {
      console.error('Failed to load level:', error);
    }
  }

  private loop(currentTime: number): void {
    const deltaTime: number = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;


    if (this.gameState.isDying) {
      if (this.player) {
        this.player.updateDeath(deltaTime);
      }
      this.gameState.updateDeathTimer(deltaTime);

      // Keep camera loosely following X during death
      if (this.player) {
        const pos = this.player.getPosition();
        this.camera.followTarget(pos.x);
      }

      // Check if death animation is finished
      if (this.gameState.deathTimer >= this.config.player.deathAnimationDuration) {
        this.respawnPlayer();
      }
      
      requestAnimationFrame((time: number) => this.loop(time));
      return;
    }

    // Check for pause toggle
    if (this.input.pausePressed()) {
      this.gameState.togglePause();
      if (this.gameState.isPaused) {
        this.uiManager.showPause();
      } else {
        this.uiManager.hidePause();
      }
    }

    if (!this.gameState.isPaused && !this.gameState.isGameOver && !this.gameState.isDying) {
      this.update(deltaTime);
    }

    requestAnimationFrame((time: number) => this.loop(time));
  }

  private update(deltaTime: number): void {
    if (!this.levelLoaded) return;
    
    const { axisX, jump } = getIntent(this.input, this.player.isGrounded());

    this.player.update(deltaTime, axisX, jump, this.colliders);
    
    const playerPosition = this.player.getPosition();
    this.camera.followTarget(playerPosition.x, undefined, this.player.getVelocity().x);
    // Keep skybox centered on player X to avoid parallax drift
    this.skyboxManager.setCenter(playerPosition.x, 0, 0);

    // Update and cull enemies via system helpers
    updateEnemiesSys(this.enemies, deltaTime, this.colliders);
    this.enemies = cullFallenSys(this.enemies, this.config.player.deathHeight);
    handleEnemyCollisionsSys(this.enemies, this.player);

    // Coins
    const gained = collectCoinsSys(this.coins, this.player);
    if (gained > 0) {
      this.gameState.addScore(gained);
      this.uiManager.updateScore(this.gameState.score);
    }
    
    this.gameState.updateTime(deltaTime);
    this.uiManager.updateTime(this.gameState.time);
  }

  private handlePlayerDeath(): void {
    console.log('Player died! Starting death animation...');
    this.gameState.startDeathAnimation();
    if (this.player) {
      this.player.startDeathAnimation();
    }
  }

  private respawnPlayer(): void {
    console.log('Respawning player...');
    this.gameState.finishDeathAnimation();
    this.uiManager.hideDeath();
    
    window.location.reload();
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((time: number) => this.loop(time));
  }
}

const game: Game = new Game();
game.start();
