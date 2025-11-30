type PauseHandlers = {
  onResume?: () => void;
  onMenu?: () => void;
};

export interface VictoryStats {
  coins: number;
  heightBonus: number;
  timeBonus: number;
  total: number;
}

export class UIManager {
  private scoreElement: HTMLElement | null;
  private timeElement: HTMLElement | null;
  private gameUIElement: HTMLElement | null;
  private pauseOverlay: HTMLElement | null;
  private deathOverlay: HTMLElement | null;
  private victoryOverlay: HTMLElement | null;
  private resumeButton: HTMLButtonElement | null;
  private menuButton: HTMLButtonElement | null;
  private pauseHandlers: PauseHandlers = {};
  private victoryAnimationActive = false;

  constructor() {
    this.gameUIElement = this.createGameUI();
    this.scoreElement = this.gameUIElement.querySelector('#score span');
    this.timeElement = this.gameUIElement.querySelector('#time span');
    this.pauseOverlay = this.createPauseOverlay();
    this.deathOverlay = this.createDeathOverlay();
    this.victoryOverlay = this.createVictoryOverlay();
    this.resumeButton = this.pauseOverlay.querySelector('button[data-action="resume"]');
    this.menuButton = this.pauseOverlay.querySelector('button[data-action="menu"]');
    this.attachPauseListeners();
  }

  private createGameUI(): HTMLElement {
    let gameUI = document.getElementById('game-ui');
    if (!gameUI) {
      gameUI = document.createElement('div');
      gameUI.id = 'game-ui';
      gameUI.innerHTML = `
        <div class="hud-stats">
          <div id="score" class="hud-item">Coins: <span>0</span></div>
          <div id="time" class="hud-item">Time: <span>0.00</span></div>
        </div>
      `;
      document.body.insertBefore(gameUI, document.body.firstChild);
    }
    return gameUI;
  }

  private createPauseOverlay(): HTMLElement {
    let overlay = document.getElementById('pause-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pause-overlay';
      overlay.style.display = 'none';
      overlay.innerHTML = `
        <div class="pause-panel">
          <h2>Game Paused</h2>
          <h3 class="pause-subheading">Controls</h3>
          <div class="pause-controls">
            <p><strong>Move:</strong> Arrow Left / Arrow Right</p>
            <p><strong>Jump:</strong> Space</p>
            <p><strong>Pause:</strong> Escape</p>
          </div>
          <div class="pause-actions">
            <button data-action="resume">Resume</button>
            <button data-action="menu">Return to Menu</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  private createDeathOverlay(): HTMLElement {
    let overlay = document.getElementById('death-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'death-overlay';
      overlay.style.display = 'none';
      overlay.innerHTML = '<div class="death-text">Game Over!</div>';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  private createVictoryOverlay(): HTMLElement {
    let overlay = document.getElementById('victory-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'victory-overlay';
      overlay.style.display = 'none';
      overlay.innerHTML = `
        <div class="victory-panel">
          <div class="victory-title">Victory!</div>
          <div class="victory-stats">
            <div class="victory-stat">
              <span class="victory-stat-label">Time Score</span>
              <span class="victory-stat-value" id="victory-time">0</span>
            </div>
            <div class="victory-stat">
              <span class="victory-stat-label">Coin Bonus</span>
              <span class="victory-stat-value" id="victory-coins">0</span>
            </div>
            <div class="victory-stat">
              <span class="victory-stat-label">Height Bonus</span>
              <span class="victory-stat-value" id="victory-height">0</span>
            </div>
            <div class="victory-stat total">
              <span class="victory-stat-label">Total Score</span>
              <span class="victory-stat-value" id="victory-total">0</span>
            </div>
          </div>
          <div class="victory-continue">Loading...</div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  private attachPauseListeners(): void {
    this.resumeButton?.addEventListener('click', () => {
      this.pauseHandlers.onResume?.();
    });
    this.menuButton?.addEventListener('click', () => {
      this.pauseHandlers.onMenu?.();
    });
  }

  configurePauseHandlers(handlers: PauseHandlers): void {
    this.pauseHandlers = handlers;
  }

  showPause(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = 'flex';
    }
  }

  hidePause(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = 'none';
    }
  }

  showDeath(): void {
    if (this.deathOverlay) {
      this.deathOverlay.style.display = 'flex';
    }
  }

  hideDeath(): void {
    if (this.deathOverlay) {
      this.deathOverlay.style.display = 'none';
    }
  }

  updateScore(score: number): void {
    if (this.scoreElement) {
      this.scoreElement.textContent = score.toString();
    }
  }

  updateTime(time: number): void {
    if (!this.timeElement) {
      return;
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time * 100) % 100);
    const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    const millisStr = milliseconds < 10 ? `0${milliseconds}` : `${milliseconds}`;
    this.timeElement.textContent = `${minutes}:${secondsStr}`;
  }

  showMessage(message: string): void {
    console.log(message);
  }

  showVictory(stats: VictoryStats): void {
    if (this.victoryOverlay) {
      this.victoryOverlay.style.display = 'flex';
      this.victoryAnimationActive = true;
      this.animateScore(stats);
    }
  }

  hideVictory(): void {
    if (this.victoryOverlay) {
      this.victoryOverlay.style.display = 'none';
      this.victoryAnimationActive = false;
    }
  }

  showContinuePrompt(): void {
    const continueEl = this.victoryOverlay?.querySelector('.victory-continue');
    if (continueEl) {
      continueEl.textContent = 'Press SPACE to continue';
    }
  }

  private animateScore(stats: VictoryStats): void {
    const timeEl = document.getElementById('victory-time');
    const coinsEl = document.getElementById('victory-coins');
    const heightEl = document.getElementById('victory-height');
    const totalEl = document.getElementById('victory-total');
    const continueEl = this.victoryOverlay?.querySelector('.victory-continue');

    if (!coinsEl || !heightEl || !timeEl || !totalEl) return;

    let currentTime = 0;
    let currentCoins = 0;
    let currentHeight = 0;
    let currentTotal = 0;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const timeStep = stats.timeBonus / steps;
    const coinStep = stats.coins / steps;
    const heightStep = stats.heightBonus / steps;
    const totalStep = stats.total / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      
      if (step < steps) {
        currentTime = Math.min(Math.round(currentTime + timeStep), stats.timeBonus);
        currentCoins = Math.min(Math.round(currentCoins + coinStep), stats.coins);
        currentHeight = Math.min(Math.round(currentHeight + heightStep), stats.heightBonus);
        currentTotal = Math.min(Math.round(currentTotal + totalStep), stats.total);
      } else {
        currentTime = stats.timeBonus;
        currentCoins = stats.coins;
        currentHeight = stats.heightBonus;
        currentTotal = stats.total;
      }

      timeEl.textContent = currentTime.toString();
      coinsEl.textContent = currentCoins.toString();
      heightEl.textContent = currentHeight.toString();
      totalEl.textContent = currentTotal.toString();

      if (step >= steps) {
        clearInterval(timer);
        // Don't show continue prompt here - wait for slide animation to complete
      }
    }, interval);
  }
}
