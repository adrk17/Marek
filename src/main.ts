import './style.css';
import { Input } from './engine/input';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { Coin } from './entities/Coin';
import { Camera } from './entities/Camera';
import { GameState } from './game/GameState';
import { UIManager, type VictoryStats } from './game/UIManager';
import { ModelLoader } from './game/ModelLoader';
import { SkyboxManager } from './game/SkyboxManager';
import { DEFAULT_CONFIG, createConfig, type GameConfig } from './config/GameConfig';
import type { Collider } from './engine/physics';
import { updateEnemies, cullFallen, handleEnemyCollisions, getActiveEnemies } from './systems/enemies';
import { collectCoins } from './systems/coins';
import { getIntent } from './systems/input';
import { detectGoalHit } from './systems/goals';
import { buildMovingPlatforms, updateMovingPlatforms, computeRideDeltaForPlayer, type MovingPlatformState } from './systems/platforms';
import { buildEndlessPlatforms, updateEndlessPlatforms, computeVerticalRideDeltaForPlayer, type EndlessPlatformState } from './systems/endlessPlatforms';
import { handleSpikeCollisions } from './systems/spikes';
import { MenuUI } from './game/ui/MenuUI';
import { loadLevelCatalog, type LevelManifest } from './game/LevelCatalog';
import { getProfile, saveProfile, getLeaderboard, recordResult, computeScore, computeScoreBreakdown, type PlayerProfile, type RunResult } from './game/storage/GameStorage';
import { BackgroundManager } from './game/BackgroundManager';
import { LoadingScreen } from './game/LoadingScreen';

interface GameSessionOptions {
  manifest: LevelManifest;
  profile: PlayerProfile;
  onFinished?: (result: RunResult) => void;
}

class Game {
  private input: Input;
  private player!: Player;
  private camera: Camera;
  private gameState: GameState;
  private uiManager: UIManager;
  private modelLoader: ModelLoader;
  private skyboxManager: SkyboxManager; // Skybox for even lighting
  private backgroundManager?: BackgroundManager // Parallax background
  private colliders: Collider[] = [];
  private coins: Coin[] = [];
  private enemies: Enemy[] = [];
  private movingPlatforms: MovingPlatformState[] = [];
  private endlessPlatforms: EndlessPlatformState[] = [];
  private lastTime = 0;
  private config: GameConfig;
  private levelLoaded = false;
  private coinsCollected = 0;
  private currentHeightBonus = 0;
  private completionTime = 0;
  private manifest: LevelManifest | null = null;
  private profile: PlayerProfile | null = null;
  private onFinished: ((result: RunResult) => void) | null = null;
  private victoryShown = false;
  private goalContactRatio = 0;
  private slideAnimationDuration = 0;
  private slideAnimationComplete = false;

  constructor(config?: Partial<GameConfig>) {
    this.config = config ? createConfig(config) : DEFAULT_CONFIG;

    this.input = new Input(this.config.controls);
    this.camera = new Camera('cam', this.config.camera);
    this.gameState = new GameState();
    this.uiManager = new UIManager();
    this.modelLoader = new ModelLoader();
    this.modelLoader.setDebugConfig(this.config.debug);
    this.skyboxManager = new SkyboxManager(this.config.skybox);
    this.backgroundManager = undefined;

    this.uiManager.configurePauseHandlers({
      onResume: () => this.resumeGame(),
      onMenu: () => this.returnToMenu()
    });
  }

  async prepareSession(options: GameSessionOptions): Promise<void> {
    this.manifest = options.manifest;
    this.profile = options.profile;
    this.onFinished = options.onFinished ?? null;
    this.coinsCollected = 0;
    this.currentHeightBonus = 0;
    this.completionTime = 0;
    this.victoryShown = false;
    this.goalContactRatio = 0;
    this.slideAnimationDuration = 0;
    this.slideAnimationComplete = false;
    this.levelLoaded = false;
    this.gameState.reset();
    this.uiManager.updateScore(0);
    this.uiManager.updateTime(0);

    // Show loading screen
    const loadingScreen = new LoadingScreen();
    loadingScreen.show();

    await this.loadLevel(this.manifest.file);

    this.player = new Player('player', this.config.player, this.config.physics);
    this.player.addDebugCollider(this.config.debug);
    this.player.onDeath(() => this.handlePlayerDeath());
    const initialPos = this.player.getPosition();
    this.backgroundManager?.update(initialPos.x, initialPos.y);

    this.levelLoaded = true;
    this.uiManager.updateScore(0);
    console.log(`Level "${this.manifest.name}" ready. Starting game loop.`);

    // Wait for X3DOM runtime to process scene (give it time to load models)
    await this.waitForX3DOMReady(loadingScreen);

    // Hide loading screen
    await loadingScreen.hide();
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((time: number) => this.loop(time));
  }

  private async waitForX3DOMReady(loadingScreen: LoadingScreen): Promise<void> {
    return new Promise((resolve) => {
      // Simple time-based loading simulation
      const maxWaitTime = 2000; // 2 seconds
      const startTime = Date.now();
      
      const progressInterval = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / maxWaitTime, 1);
        loadingScreen.setProgress(progress * 100);
        
        if (progress >= 1) {
          clearInterval(progressInterval);
          resolve();
        }
      }, 50);
    });
  }

  private async loadLevel(levelUrl: string): Promise<void> {
    try {
      console.log(`Loading level from: ${levelUrl}`);
      const levelData = await this.modelLoader.loadLevelFromFile(levelUrl);

      this.colliders = this.modelLoader.loadFromJSON(levelData);

      if (levelData.backgroundConfig) {
        this.backgroundManager = new BackgroundManager(levelData.backgroundConfig);
      }

      if (levelData.enemies && levelData.enemies.length > 0) {
        this.modelLoader.createEnemies(levelData.enemies);
      }

      this.coins = levelData.models
        .filter(model => model.type === 'coin')
        .map((model) => {
          const coinElement = document.getElementById(model.id);

          if (!coinElement || !model.size) {
            console.warn(`Coin element not found or missing size: ${model.id}`);
            return null;
          }

          return new Coin(
            coinElement as Element,
            {
              size: model.size.x,
              value: model.value || this.config.coin.value
            }
          );
        })
        .filter((coin): coin is Coin => coin !== null);

      this.enemies = (levelData.enemies || []).map((enemyDef) => {
        const enemyElement = document.getElementById(enemyDef.id);

        if (!enemyElement) {
          console.warn(`Enemy element not found: ${enemyDef.id}`);
          return null;
        }

        const enemy = new Enemy(
          enemyDef.id,
          { x: enemyDef.position.x, y: enemyDef.position.y },
          {
            size: enemyDef.size || { width: 0.8, height: 0.8, depth: 0.8 },
            speed: enemyDef.speed || 2,
            patrolDistance: enemyDef.patrolDistance || 3,
            behaviorType: enemyDef.type || 'grzegorz',
            jumpInterval: enemyDef.jumpInterval,
            jumpForce: enemyDef.jumpForce
          },
          this.config.physics
        );
        
        // Set model node reference for rotation (if enemy has a model)
        const modelNode = document.getElementById(`${enemyDef.id}-model`);
        if (modelNode) {
          enemy.setModelNode(modelNode);
        }
        
        // Add debug collider if enabled
        enemy.addDebugCollider(this.config.debug);
        
        return enemy;
      }).filter((enemy): enemy is Enemy => enemy !== null);

      this.movingPlatforms = buildMovingPlatforms(this.colliders, this.config.movingPlatforms);
      this.endlessPlatforms = buildEndlessPlatforms(this.colliders, this.config.endlessPlatforms);

      console.log(`Loaded level: ${this.manifest?.name ?? 'Unknown'}`);
      console.log(`- Models: ${this.colliders.length}`);
      console.log(`- Coins: ${this.coins.length}`);
      console.log(`- Enemies: ${this.enemies.length}`);
    } catch (error) {
      console.error('Failed to load level:', error);
      throw error;
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

      if (this.player) {
        const pos = this.player.getPosition();
        this.camera.followTarget(pos.x);
        this.backgroundManager?.update(pos.x, pos.y);
      }

      if (this.gameState.deathTimer >= this.config.player.deathAnimationDuration) {
        this.respawnPlayer();
      }

      requestAnimationFrame((time: number) => this.loop(time));
      return;
    }

    if (this.input.pausePressed()) {
      if (this.gameState.isPaused) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    }

    if (!this.gameState.isPaused && !this.gameState.isDying) {
      this.update(deltaTime);
    }

    requestAnimationFrame((time: number) => this.loop(time));
  }

  private update(deltaTime: number): void {
    if (!this.levelLoaded) return;

    const { axisX, jump } = getIntent(this.input, this.player.isGrounded());

    if (this.gameState.isWinning) {
      this.player.updateGoalSlide(deltaTime);
    } else {
      this.player.update(deltaTime, axisX, jump, this.colliders);
    }

    const playerPosition = this.player.getPosition();
    this.camera.followTarget(playerPosition.x);
    this.skyboxManager.setCenter(playerPosition.x, 0, 0);
    this.backgroundManager?.update(playerPosition.x, playerPosition.y);

    if (this.movingPlatforms.length) {
      updateMovingPlatforms(this.movingPlatforms, deltaTime);
      if (!this.gameState.isWinning && this.player.isGrounded()) {
        const ride = computeRideDeltaForPlayer(this.player.getAABB(), this.movingPlatforms);
        if (ride.dx !== 0 || ride.dy !== 0) {
          this.player.applyPlatformDelta(ride.dx, ride.dy);
        }
      }
    }

    if (this.endlessPlatforms.length) {
      updateEndlessPlatforms(this.endlessPlatforms, deltaTime);
      if (!this.gameState.isWinning && this.player.isGrounded()) {
        const vdy = computeVerticalRideDeltaForPlayer(this.player.getAABB(), this.endlessPlatforms);
        if (vdy !== 0) {
          this.player.applyPlatformDelta(0, vdy);
        }
      }
    }

    const activeUpdateRadius = this.config.activation.enemyUpdateRadius;
    const activeCollisionRadius = this.config.activation.enemyCollisionRadius ?? activeUpdateRadius;

    const activeForUpdate = getActiveEnemies(this.enemies, playerPosition.x, playerPosition.y, activeUpdateRadius);
    updateEnemies(activeForUpdate, deltaTime, this.colliders);
    this.enemies = cullFallen(this.enemies, this.config.player.deathHeight);

    const activeForCollisions = getActiveEnemies(this.enemies, playerPosition.x, playerPosition.y, activeCollisionRadius);
    handleEnemyCollisions(activeForCollisions, this.player);

    // Check spike collisions
    handleSpikeCollisions(this.colliders, this.player);

    const gained = collectCoins(this.coins, this.player);
    if (gained > 0) {
      this.coinsCollected += gained;
      this.uiManager.updateScore(this.coinsCollected);
    }

    this.gameState.updateTime(deltaTime);
    this.uiManager.updateTime(this.gameState.time);

    if (!this.gameState.isWinning) {
      const hit = detectGoalHit(this.colliders, this.player);
      if (hit) {
        const cfg = this.config.goal;
        const ratio = Math.max(0, Math.min(1, hit.ratio));
        this.currentHeightBonus = Math.round(cfg.poleBonusMin + (cfg.poleBonusMax - cfg.poleBonusMin) * ratio);
        this.completionTime = this.gameState.time;
        this.goalContactRatio = ratio;

        // Calculate slide animation duration based on contact height
        // If hit at bottom (ratio=0), slide is instant
        // If hit at top (ratio=1), slide takes full reloadDelay time
        const slideDistance = hit.contactY - hit.bottomY;
        const slideTime = slideDistance / cfg.poleSlideSpeed;
        this.slideAnimationDuration = slideTime;
        this.slideAnimationComplete = false;

        this.gameState.startWin();
        this.player.startGoalSlide(hit.poleX, hit.bottomY, cfg.poleSlideSpeed);
        
        // Show victory screen immediately
        this.showVictoryScreen();
        this.victoryShown = true;
      }
    } else {
      this.gameState.updateWinTimer(deltaTime);
      
      // Check if slide animation is complete
      if (!this.slideAnimationComplete && this.gameState.winTimer >= this.slideAnimationDuration) {
        this.slideAnimationComplete = true;
        this.enableContinue();
      }
    }
  }

  private handlePlayerDeath(): void {
    console.log('Player died! Starting death animation...');
    this.gameState.startDeathAnimation();
    if (this.player) {
      this.player.startDeathAnimation();
    }
    this.uiManager.showDeath();
  }

  private respawnPlayer(): void {
    console.log('Respawning player...');
    this.gameState.finishDeathAnimation();
    this.uiManager.hideDeath();
    window.location.reload();
  }

  private showVictoryScreen(): void {
    if (!this.manifest || !this.profile) return;

    const breakdown = computeScoreBreakdown(this.completionTime, this.coinsCollected, this.currentHeightBonus);

    const victoryStats: VictoryStats = {
      coins: breakdown.coinBonus,
      heightBonus: breakdown.heightBonus,
      timeBonus: breakdown.timeScore,
      total: breakdown.total
    };

    this.uiManager.showVictory(victoryStats);
  }

  private enableContinue(): void {
    // Enable space to continue after slide animation completes
    const continueHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        window.removeEventListener('keydown', continueHandler);
        this.finishLevel();
      }
    };
    window.addEventListener('keydown', continueHandler);
    this.uiManager.showContinuePrompt();
  }

  private finishLevel(): void {
    console.log('Level finished!');
    this.gameState.finishWin();

    if (this.manifest && this.profile) {
      const result: RunResult = {
        levelId: this.manifest.id,
        nickname: this.profile.nickname,
        time: this.completionTime || this.gameState.time,
        coins: this.coinsCollected,
        heightBonus: this.currentHeightBonus
      };
      recordResult(result);
      this.onFinished?.(result);
    }
    
    window.location.reload();
  }

  private pauseGame(): void {
    if (!this.gameState.isPaused) {
      this.gameState.pause();
      this.uiManager.showPause();
    }
  }

  private resumeGame(): void {
    if (this.gameState.isPaused) {
      this.gameState.resume();
      this.uiManager.hidePause();
      this.lastTime = performance.now();
    }
  }

  private returnToMenu(): void {
    this.pauseGame();
    window.location.reload();
  }
}

class GameApplication {
  private menu: MenuUI;
  private profile: PlayerProfile;
  private levels: LevelManifest[] = [];
  private activeGame: Game | null = null;

  constructor() {
    this.profile = getProfile();
    this.menu = new MenuUI({
      onLevelSelected: (level) => this.handleLevelSelected(level),
      onPlay: (level) => { void this.startGame(level); },
      onProfileSave: (nickname) => this.updateProfile(nickname)
    });
  }

  async init(): Promise<void> {
    this.menu.setProfile(this.profile);
    this.menu.show();

    const catalog = await loadLevelCatalog();
    this.levels = catalog;
    this.menu.setLevels(this.levels);
  }

  private handleLevelSelected(level: LevelManifest): void {
    const leaderboard = getLeaderboard(level.id);
    this.menu.setLeaderboard(leaderboard);
  }

  private updateProfile(nickname: string): void {
    const trimmed = nickname.trim();
    this.profile = { nickname: trimmed || 'Guest' };
    saveProfile(this.profile);
    this.menu.setProfile(this.profile);
  }

  private async startGame(level: LevelManifest): Promise<void> {
    if (this.activeGame) {
      return;
    }

    try {
      this.menu.hide();
      this.activeGame = new Game();
      await this.activeGame.prepareSession({
        manifest: level,
        profile: this.profile,
        onFinished: () => {
          const updated = getLeaderboard(level.id);
          this.menu.setLeaderboard(updated);
        }
      });
      this.activeGame.start();
    } catch (error) {
      console.error('Failed to start game:', error);
      this.activeGame = null;
      this.menu.show();
    }
  }
}

const app = new GameApplication();
void app.init();
