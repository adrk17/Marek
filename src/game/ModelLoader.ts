import type { Collider } from '../engine/physics';
import { ColliderType } from '../engine/collision';
import type { Vec2, Vec3 } from '../engine/types';
import { createStairs as createStairsFactory } from './factories/StairsFactory';

export interface LevelData {
  name: string;
  models: ModelDefinition[];
  enemies?: EnemyDefinition[];
}

export interface ModelDefinition {
  id: string;
  type: 'ground' | 'platform' | 'wall' | 'player' | 'enemy' | 'coin' | 'custom' | 'stairs' | 'decor';
  colliderType?: ColliderType; // Optional for 'decor'
  position: Vec3;
  size?: Vec3; // Optional for 'decor'
  /** Optional per-step offset for 'stairs' models. Defaults to size.x/size.y. */
  step?: Vec2; // { x: strideX, y: strideY }
  x3dUrl?: string; // Optional X3D model file, if not provided uses default shape
  color?: string; // Optional custom color for default shape (RGB format: "r g b")
  value?: number; // For coins - point value
  rotation?: Vec3; // Optional Euler rotation in degrees (XYZ)
  scale?: number | Vec3; // Optional scale (uniform or per-axis)
}

export interface EnemyDefinition {
  id: string;
  position: Vec3;
  type?: 'grzegorz' | 'kacper' | 'pawel_jumper'
  speed?: number;
  patrolDistance?: number;
  jumpInterval?: number;
  jumpForce?: number;
}

export class ModelLoader {
  /**
   * Load level from JSON and create colliders.
   * Each model will try to load X3D file if x3dUrl is provided,
   * otherwise falls back to default shape based on size parameters.
   */
  loadFromJSON(levelData: LevelData): Collider[] {
    const colliders: Collider[] = [];

    for (const model of levelData.models) {
      if (model.type === 'stairs') {
        // Expand stairs into multiple step blocks via factory
        const stepColliders = createStairsFactory(model as ModelDefinition & { size: Vec3 });
        colliders.push(...stepColliders);
      } else if (model.type === 'decor') {
        this.loadModelWithFallback(model);
      } else {
        this.loadModelWithFallback(model);
        if (model.size && model.colliderType) {
          colliders.push({
            pos: model.position,
            size: model.size,
            type: model.type,
            colliderType: model.colliderType
          });
        }
      }
    }

    return colliders;
  }

  /**
   * Attempt to load X3D model, create default shape if model file not found
   */
  private loadModelWithFallback(model: ModelDefinition): void {
    const scene: Element | null = document.querySelector('scene');
    if (!scene) return;

    const transform: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Transform');
    transform.setAttribute('translation', `${model.position.x} ${model.position.y} ${model.position.z}`);
    transform.setAttribute('class', model.type);
    transform.setAttribute('id', model.id);

    // Build nested rotation transforms if rotation provided (Euler XYZ in degrees)
    let targetParent: Element = transform;
    if (model.rotation) {
      const rx = (model.rotation.x || 0) * Math.PI / 180;
      const ry = (model.rotation.y || 0) * Math.PI / 180;
      const rz = (model.rotation.z || 0) * Math.PI / 180;

      const tX: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Transform');
      tX.setAttribute('rotation', `1 0 0 ${rx}`);
      const tY: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Transform');
      tY.setAttribute('rotation', `0 1 0 ${ry}`);
      const tZ: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Transform');
      tZ.setAttribute('rotation', `0 0 1 ${rz}`);
      transform.appendChild(tX);
      tX.appendChild(tY);
      tY.appendChild(tZ);
      targetParent = tZ;
    }

    // Apply scale to the target parent if provided
    if (model.scale !== undefined && model.scale !== null) {
      if (typeof model.scale === 'number') {
        const s = model.scale;
        targetParent.setAttribute('scale', `${s} ${s} ${s}`);
      } else {
        const sx = model.scale.x ?? 1;
        const sy = model.scale.y ?? 1;
        const sz = model.scale.z ?? 1;
        targetParent.setAttribute('scale', `${sx} ${sy} ${sz}`);
      }
    }

    const url = model.x3dUrl;
    if (url) {
      // Try to load external X3D model
      const inline: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Inline');
      inline.setAttribute('url', url);
      
      // Add error handler - if model fails to load, append default shape
      inline.addEventListener('load', () => {
        console.log(`Loaded X3D model: ${url}`);
      });
      
      inline.addEventListener('error', () => {
        console.warn(`Failed to load X3D model: ${url}, using default shape`);
        targetParent.appendChild(this.createDefaultShape(model));
      });
      
      targetParent.appendChild(inline);
    } else {
      const shape: Element = this.createDefaultShape(model);
      targetParent.appendChild(shape);
    }

    scene.appendChild(transform);
  }

  private createDefaultShape(model: ModelDefinition): Element {
    const shape: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Shape');
    
    const appearance: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Appearance');
    const material: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Material');
    
    // Determine color based on type or use custom color
    let color: string;
    if (model.color) {
      color = model.color;
    } else {
      switch (model.type) {
        case 'ground':
          color = '0.3 0.65 0.35'; // green
          break;
        case 'platform':
          color = '0.85 0.75 0.55'; // sandy beige
          break;
        case 'stairs':
          color = '0.85 0.75 0.55'; // same as platform
          break;
        case 'player':
          color = '0.9 0.25 0.25'; // strong red
          break;
        case 'enemy':
          color = '0.65 0.25 0.65'; // deep purple
          break;
        case 'coin':
          color = '1.0 0.8 0.0'; // gold
          break;
        case 'decor':
          color = '0.6 0.2 0.8'; // purple for decorative fallback
          break;
        default:
          color = '0.6 0.6 0.6'; // gray
      }
    }
    
    material.setAttribute('diffuseColor', color);
    
    if (model.type === 'coin') {
      material.setAttribute('emissiveColor', '0.15 0.12 0.0'); 
      material.setAttribute('specularColor', '0.3 0.3 0.2');
      material.setAttribute('shininess', '0.15'); 
    } else {
      material.setAttribute('specularColor', '0.1 0.1 0.1'); 
      material.setAttribute('shininess', '0.05'); 
    }
    
    appearance.appendChild(material);
    shape.appendChild(appearance);

    // Create box geometry with specified size
    const box: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Box');
    const sx = model.size?.x ?? 1;
    const sy = model.size?.y ?? 1;
    const sz = model.size?.z ?? 1;
    box.setAttribute('size', `${sx} ${sy} ${sz}`);
    shape.appendChild(box);

    return shape;
  }

  /**
   * Create enemy elements in the scene from enemy definitions
   */
  createEnemies(enemies: EnemyDefinition[]): void {
    const scene: Element | null = document.querySelector('scene');
    if (!scene) return;

    for (const enemy of enemies) {
      const transform: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Transform');
      transform.setAttribute('translation', `${enemy.position.x} ${enemy.position.y} ${enemy.position.z}`);
      transform.setAttribute('class', 'enemy');
      transform.setAttribute('id', enemy.id);

      const shape: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Shape');
      
      const appearance: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Appearance');
      const material: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Material');
      
      // Different colors for different enemy types
      let color: string;
      switch (enemy.type) {
        case 'grzegorz':
          color = '0.6 0.3 0.15'; // Brown (slow patrol)
          break;
        case 'kacper':
          color = '0.2 0.7 0.3'; // Green (fast patrol)
          break;
        case 'pawel_jumper':
          color = '0.9 0.6 0.2'; // Orange (jumps)
          break;
        default:
          color = '0.9 0.2 0.2'; // Red (fallback)
      }
      
      material.setAttribute('diffuseColor', color);
      material.setAttribute('specularColor', '0.2 0.1 0.1');
      material.setAttribute('shininess', '0.1');
      appearance.appendChild(material);
      shape.appendChild(appearance);

      // Small red cube - 0.8x0.8x0.8
      const box: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Box');
      box.setAttribute('size', '0.8 0.8 0.8');
      shape.appendChild(box);

      transform.appendChild(shape);
      scene.appendChild(transform);
    }
  }

  loadLevelFromFile(url: string): Promise<LevelData> {
    return fetch(url).then(response => response.json());
  }
}
