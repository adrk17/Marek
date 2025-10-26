# Levels Directory

This folder contains JSON level definitions for the game.

## Level Format

Each level is a JSON file with models and coins:

```json
{
  "name": "Level 1",
  "models": [
    {
      "id": "ground",
      "type": "ground",
      "colliderType": "solid",
      "position": { "x": 0, "y": -0.5, "z": 0 },
      "size": { "x": 20, "y": 1, "z": 10 },
      "x3dUrl": "/models/ground.x3d",
      "color": "0.3 0.7 0.3"
    }
  ],
  "coins": [
    { "position": { "x": 5, "y": 3, "z": 0 }, "value": 1 }
  ]
}
```

## Model Properties

- **id**: Unique identifier (used as DOM element id)
- **type**: `'ground' | 'platform' | 'player' | 'enemy' | 'custom'`
- **colliderType**: `'solid'` (blocks movement) or `'trigger'` (pass-through)
- **position**: 3D coordinates `{ x, y, z }`
- **size**: Bounding box size `{ x, y, z }`
- **x3dUrl** (optional): Path to X3D model file in `/models/`
- **color** (optional): RGB color for default shape `"r g b"`

## How Levels Are Loaded

1. Game calls `ModelLoader.loadLevelFromFile('/levels/level1.json')`
2. ModelLoader creates all objects in X3D scene
3. If `x3dUrl` is provided, tries to load external model
4. If model fails or not specified, creates default geometric shape
5. Returns collider array for physics system

## Adding New Levels

1. Create `level2.json`, `level3.json`, etc.
2. Define your platforms, enemies, coins
3. Load in game: `loadLevel('/levels/level2.json')`

The first level (`level1.json`) is loaded automatically on game start.
