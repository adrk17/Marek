export class UIManager {
  private scoreElement: HTMLElement | null;
  private timeElement: HTMLElement | null;
  private gameUIElement: HTMLElement | null;
  private pauseOverlay: HTMLElement | null;
  private deathOverlay: HTMLElement | null;

  constructor() {
    this.gameUIElement = this.createGameUI();
    this.scoreElement = document.querySelector('#score span');
    this.timeElement = document.querySelector('#time span');
    this.pauseOverlay = this.createPauseOverlay();
    this.deathOverlay = this.createDeathOverlay();
  }

  private createGameUI(): HTMLElement {
    // Check if UI already exists
    let gameUI = document.getElementById('game-ui');
    if (gameUI) {
      return gameUI;
    }

    // Create main UI container
    gameUI = document.createElement('div');
    gameUI.id = 'game-ui';

    // Create controls panel
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
      <h3>Controls</h3>
      <div class="control-item"><span class="key">←→</span> Move</div>
      <div class="control-item"><span class="key">Space</span> Jump</div>
      <div class="control-item"><span class="key">ESC</span> Pause</div>
    `;

    // Create stats panel
    const stats = document.createElement('div');
    stats.className = 'stats';
    stats.innerHTML = `
      <div id="score">Coins: <span>0</span></div>
      <div id="time">Time: <span>0:00</span></div>
    `;

    gameUI.appendChild(controls);
    gameUI.appendChild(stats);
    document.body.insertBefore(gameUI, document.body.firstChild);

    return gameUI;
  }

  private createPauseOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'pause-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = '<div class="pause-text">GAME PAUSED</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  private createDeathOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'death-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = '<div class="death-text">MAREK DIED!</div>';
    document.body.appendChild(overlay);
    return overlay;
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
    if (this.timeElement) {
      const minutes: number = Math.floor(time / 60);
      const seconds: number = Math.floor(time % 60);
      const secondsStr: string = seconds < 10 ? `0${seconds}` : `${seconds}`;
      const display: string = `${minutes}:${secondsStr}`;
      
      if (this.timeElement) {
        this.timeElement.textContent = display;
      }
    }
  }

  showMessage(message: string): void {
    console.log(message);
  }
}
