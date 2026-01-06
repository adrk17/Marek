export class LoadingScreen {
  private container: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private progressFill: HTMLDivElement;
  private statusText: HTMLDivElement;
  private totalItems = 0;
  private loadedItems = 0;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'loading-screen';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Press Start 2P', monospace;
      color: white;
    `;

    // Create title
    const title = document.createElement('div');
    title.textContent = 'LOADING LEVEL...';
    title.style.cssText = `
      font-size: 24px;
      margin-bottom: 40px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    `;
    this.container.appendChild(title);

    // Create progress bar container
    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 400px;
      height: 30px;
      background: rgba(255, 255, 255, 0.1);
      border: 3px solid white;
      position: relative;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;

    // Create progress fill
    this.progressFill = document.createElement('div');
    this.progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #45a049);
      transition: width 0.3s ease;
    `;
    this.progressBar.appendChild(this.progressFill);
    this.container.appendChild(this.progressBar);

    // Create status text
    this.statusText = document.createElement('div');
    this.statusText.textContent = 'Initializing...';
    this.statusText.style.cssText = `
      font-size: 12px;
      margin-top: 20px;
      color: rgba(255, 255, 255, 0.7);
    `;
    this.container.appendChild(this.statusText);

    document.body.appendChild(this.container);
  }

  setTotal(total: number): void {
    this.totalItems = total;
    this.loadedItems = 0;
    this.updateProgress();
  }

  incrementLoaded(itemName?: string): void {
    this.loadedItems++;
    this.updateProgress();
    if (itemName) {
      this.statusText.textContent = `Loaded: ${itemName}`;
    }
  }

  private updateProgress(): void {
    if (this.totalItems === 0) {
      this.progressFill.style.width = '0%';
      return;
    }

    const percentage = (this.loadedItems / this.totalItems) * 100;
    this.progressFill.style.width = `${percentage}%`;
    
    if (this.loadedItems < this.totalItems) {
      this.statusText.textContent = `Loading assets... ${this.loadedItems}/${this.totalItems}`;
    } else {
      this.statusText.textContent = 'Ready!';
    }
  }

  async hide(): Promise<void> {
    return new Promise((resolve) => {
      // Force progress to 100% before hiding
      this.progressFill.style.width = '100%';
      this.statusText.textContent = 'Ready!';
      
      // Wait a bit so user sees completion
      setTimeout(() => {
        this.container.style.transition = 'opacity 0.5s ease';
        this.container.style.opacity = '0';
        
        setTimeout(() => {
          document.body.removeChild(this.container);
          resolve();
        }, 500);
      }, 300);
    });
  }

  show(): void {
    this.container.style.opacity = '1';
    this.container.style.display = 'flex';
  }
}

