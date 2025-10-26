import type { SkyboxConfig } from '../config/GameConfig';

export class SkyboxManager {
  private skyboxAppearance: Element | null;
  private skyboxMaterial: Element | null;
  private config: SkyboxConfig;

  constructor(config: SkyboxConfig) {
    this.config = config;
    this.skyboxAppearance = document.getElementById('skybox-appearance');
    this.skyboxMaterial = document.getElementById('skybox-material');
    this.initialize();
  }

  private initialize(): void {
    if (!this.skyboxAppearance || !this.skyboxMaterial) {
      console.warn('Skybox elements not found in DOM');
      return;
    }

    // Try to load texture if provided
    if (this.config.textureUrl) {
      this.loadTexture(this.config.textureUrl);
    } else {
      // Use fallback color
      this.useFallbackColor();
    }
  }

  private loadTexture(textureUrl: string): void {
    if (!this.skyboxAppearance) return;

    // Create ImageTexture element
    const imageTexture = document.createElementNS(
      'http://www.web3d.org/specifications/x3d-namespace',
      'ImageTexture'
    );
    imageTexture.setAttribute('url', textureUrl);

    // Add error handler - if texture fails, use fallback
    imageTexture.addEventListener('error', () => {
      console.warn(`Failed to load skybox texture: ${textureUrl}, using fallback color`);
      this.useFallbackColor();
    });

    // Remove existing texture if any
    const existingTexture = this.skyboxAppearance.querySelector('ImageTexture');
    if (existingTexture) {
      this.skyboxAppearance.removeChild(existingTexture);
    }

    this.skyboxAppearance.appendChild(imageTexture);
  }

  private useFallbackColor(): void {
    if (!this.skyboxMaterial) return;

    this.skyboxMaterial.setAttribute('diffuseColor', '0 0 0');
    this.skyboxMaterial.setAttribute('emissiveColor', this.config.fallbackColor);
  }

  // Change skybox texture at runtime
  setTexture(textureUrl: string): void {
    this.config.textureUrl = textureUrl;
    this.loadTexture(textureUrl);
  }

  // Change skybox color at runtime
  setColor(color: string): void {
    this.config.fallbackColor = color;
    this.config.textureUrl = undefined;
    this.useFallbackColor();
  }
}
