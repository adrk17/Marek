export class GameState {
  private _score: number = 0;
  private _time: number = 0;
  private _isPaused: boolean = false;
  private _isGameOver: boolean = false;
  private _isDying: boolean = false;
  private _deathTimer: number = 0;
  private _isWinning: boolean = false;
  private _winTimer: number = 0;

  get score(): number {
    return this._score;
  }

  get time(): number {
    return this._time;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get isGameOver(): boolean {
    return this._isGameOver;
  }

  get isDying(): boolean {
    return this._isDying;
  }

  get deathTimer(): number {
    return this._deathTimer;
  }

  get isWinning(): boolean {
    return this._isWinning;
  }

  get winTimer(): number {
    return this._winTimer;
  }

  addScore(points: number): void {
    this._score += points;
  }

  updateTime(deltaTime: number): void {
    if (!this._isPaused && !this._isGameOver && !this._isDying && !this._isWinning) {
      this._time += deltaTime;
    }
  }

  updateDeathTimer(deltaTime: number): void {
    if (this._isDying) {
      this._deathTimer += deltaTime;
    }
  }

  updateWinTimer(deltaTime: number): void {
    if (this._isWinning) {
      this._winTimer += deltaTime;
    }
  }

  startDeathAnimation(): void {
    this._isDying = true;
    this._deathTimer = 0;
  }

  finishDeathAnimation(): void {
    this._isDying = false;
    this._deathTimer = 0;
  }

  startWin(): void {
    this._isWinning = true;
    this._winTimer = 0;
  }

  finishWin(): void {
    this._isWinning = false;
    this._winTimer = 0;
  }

  pause(): void {
    this._isPaused = true;
  }

  resume(): void {
    this._isPaused = false;
  }

  togglePause(): void {
    this._isPaused = !this._isPaused;
  }

  gameOver(): void {
    this._isGameOver = true;
  }

  reset(): void {
    this._score = 0;
    this._time = 0;
    this._isPaused = false;
    this._isGameOver = false;
    this._isDying = false;
    this._deathTimer = 0;
    this._isWinning = false;
    this._winTimer = 0;
  }
}
