# Marek

A 3D platformer game built with X3DOM, TypeScript, and Vite.

## Installation

```bash
npm install
```

## Running the Game

```bash
npm run dev
```

Open your browser at `http://localhost:3000`

## Debug Mode

To visualize collider boxes alongside 3D models, enable debug mode in your config:

```typescript
import { createConfig } from './config/GameConfig';

const config = createConfig({
  debug: {
    showColliders: true,      // Show wireframe collider boxes
    colliderColor: '0 1 0',   // Green wireframe
    colliderOpacity: 0.5      // Semi-transparent
  }
});
```

This displays green wireframe boxes around all colliders, making it easy to align 3D models with their collision boundaries.

## Loading 3D Models from Blender

### Exporting from Blender to X3D

1. **Create your model** in Blender with materials/textures
2. **Export to X3D**:
   - File → Export → X3D Extensible 3D (.x3d)

### Level JSON Configuration

Add your model to the level JSON:

```json
{
  "id": "custom_platform",
  "type": "platform",
  "colliderType": "solid",
  "position": { "x": 10, "y": 2, "z": 0 },
  "size": { "x": 4, "y": 1, "z": 4 },
  "x3dUrl": "/models/my_platform.x3d",
  "modelScale": 0.5
}
```

- `size` - Defines the **collider** dimensions
- `modelScale` - Scales only the **visual model** (not collider)
- `x3dUrl` - Path to your exported X3D file

### Tips for Model-Collider Alignment

1. Enable `showColliders: true` in debug config
2. Adjust `modelScale` to fit the model within the collider wireframe
3. Use `rotation` to orient the model correctly:

   ```json
   "rotation": { "x": 0, "y": 90, "z": 0 }
   ```

4. If model origin is offset, adjust in Blender (Object → Set Origin → Origin to Geometry)
