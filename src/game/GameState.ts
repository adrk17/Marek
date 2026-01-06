export class GameState {
  private _time: number = 0;
  private _isPaused: boolean = false;
  private _isDying: boolean = false;
  private _deathTimer: number = 0;
  private _isWinning: boolean = false;
  private _winTimer: number = 0;

  get time(): number {
    return this._time;
  }

  get isPaused(): boolean {
    return this._isPaused;
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

  updateTime(deltaTime: number): void {
    if (!this._isPaused && !this._isDying && !this._isWinning) {
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

  reset(): void {
    this._time = 0;
    this._isPaused = false;
    this._isDying = false;
    this._deathTimer = 0;
    this._isWinning = false;
    this._winTimer = 0;
  }
}
