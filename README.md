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

Open your browser at `http://localhost:3002`
- `jumpPressed()` method ensures jumping only when grounded

### Physics System (`engine/physics.ts`)

**AABB Collision Detection**:
- Uses Axis-Aligned Bounding Boxes for simple, fast collision checks
- `aabbOverlap()` function checks if two boxes intersect in 3D space

**Collision Resolution**:
- `resolveEntity()` handles entity-environment collisions (used by Player and Enemy)
- Calculates penetration depth on all axes (X, Y)
- Resolves smallest penetration first for realistic physics
- Detects ground contact and head collisions
- Prevents player from passing through solid objects

**Physics Constants**:
- Gravity: -22 units/s²
- Player speed: 6 units/s
- Jump force: 10 units/s

### Player Entity (`entities/Player.ts`)

**Configuration Interface**:
```typescript
interface PlayerConfig {
  speed: number;        // 6 units/s default
  jumpForce: number;    // 10 units/s default
  gravity: number;      // -22 units/s² default
}
```

**Features**:
- Size: 0.8×1.6×0.8 units (standing rectangular prism)
- Configurable physics constants via constructor
- Velocity-based movement with gravity integration
- Collision resolution via physics engine
- Public methods: `update()`, `getAABB()`, `getPosition()`, `isGrounded()`, `reset()`
- Private fields with proper encapsulation
- Updates X3D transform each frame

### Camera System (`entities/Camera.ts`)

**Configuration Interface**:
```typescript
interface CameraConfig {
  offsetY: number;      // 4 units default
  offsetZ: number;      // 14 units default
  rotation: number;     // 0.3 radians default
  fieldOfView: number;  // 0.785 radians (~45°)
}
```

**Features**:
- **2.5D Perspective**: Angled view at 0.3 radians
- **Dynamic Following**: `followTarget(x)` method tracks player X position
- **Configurable Offsets**: Customizable Y/Z positioning
- **Public Methods**: `followTarget()`, `setRotation()`, `setFieldOfView()`

### Coin Collection (`entities/Coin.ts`)

**Features**:
- Spherical colliders (0.6 unit radius)
- AABB overlap check with player each frame via `tryCollect()`
- Private `checkOverlap()` method for collision detection
- Sets `render='false'` when collected (immediate visual feedback)
- Public methods: `tryCollect()`, `isTaken()`, `reset()`
- Proper encapsulation with private fields

### Game State (`game/GameState.ts`)

**Managed State**:
- **Score**: Coin collection counter
- **Time**: Elapsed game time in seconds
- **Pause State**: Game can be paused/resumed
- **Game Over State**: End condition tracking

**Public Interface**:
- Getters: `score`, `time`, `isPaused`, `isGameOver`
- Methods: `addScore()`, `updateTime()`, `pause()`, `resume()`, `gameOver()`, `reset()`
- Encapsulated with private fields and public accessors

### UI Manager (`game/UIManager.ts`)

**Responsibilities**:
- Updates score display in real-time
- Formats and displays timer (MM:SS format)
- Manages DOM elements for game UI
- Type-safe with explicit return types

### X3D Scene Structure (`index.html`)

The X3D scene is organized into clear sections with comments:

**1. Camera Section**:
- Single viewpoint controlling player perspective
- Position: (0, 4, 14) with -0.3 radian rotation for 2.5D view

**2. Lighting Section**:
- Three directional lights for depth perception
- Main light: intensity 0.9, direction (0, -1, -1)
- Fill light: intensity 0.4, blue-tinted (0.8, 0.8, 1)
- Ambient: intensity 0.3

**3. Static Environment Section**:
- Ground platform: 20×1×10 units at (0, -0.5, 0)
- Floating platforms: Two platforms for vertical gameplay
- Each object can load X3D model or use default geometric shape

**4. Collectibles Section**:
- Coins with TRIGGER colliders (pass-through)
- Golden spheres with emissive material

**5. Entities Section**:
- Player character (can be X3D model or default shape)
- Future: Enemies, NPCs, moving platforms
- All entities support X3D model loading with automatic fallback

**6. Skybox Section**:
- Large background sphere for atmosphere
- Emissive material creates ambient lighting

**Model Loading Philosophy**:
Every physical object (platforms, player, enemies) can have:
- **X3D Model**: Custom 3D model loaded from `.x3d` file
- **Fallback Shape**: If model fails/missing, uses geometric primitive (box/sphere)
- **Parameters**: Position, size, collision type defined in JSON

### X3D Scene Structure (`index.html`)

- **Fullscreen**: Fixed positioning prevents overflow/scrolling
- **Glass-morphism**: `backdrop-filter: blur(10px)` on UI panels
- **Responsive**: Adapts to smaller screens with media queries
- **Accessibility**: High contrast, clear visual hierarchy

## How It Works

### Main Game Class (`main.ts`)

The `Game` class orchestrates all systems:

```typescript
class Game {
  private input: Input;
  private player: Player;
  private camera: Camera;
  private gameState: GameState;
  private uiManager: UIManager;
  private levelLoader: LevelLoader;
  private colliders: Collider[];
  private coins: Coin[];
  
  constructor() { /* Initialize all systems */ }
  private loop(currentTime: number): void { /* Main loop */ }
  private update(deltaTime: number): void { /* Update logic */ }
  private handleCoinCollection(): void { /* Collision checks */ }
  start(): void { /* Begin game loop */ }
}
```

### Game Loop (60 FPS)

1. **Delta Time Calculation**: Measures time since last frame (capped at 50ms)
2. **Pause Check**: Skip update if paused or game over
3. **Input Processing**: Read keyboard state via `Input` class
4. **Player Update**: 
   - Get axis input and jump state
   - Update player physics
   - Resolve collisions
5. **Camera Update**: Follow player X position
6. **Coin Collection**: Check AABB overlaps, update score/UI
7. **Time Update**: Increment game timer, update UI
8. **Render**: X3DOM automatically renders scene

### Collision Pipeline

```
Player movement input
    ↓
Calculate next position (current + velocity × deltaTime)
    ↓
For each collider in scene:
    ↓
Check AABB overlap
    ↓
If overlapping:
    ↓
Calculate penetration depth (X, Y axes)
    ↓
Resolve smallest penetration
    ↓
Adjust velocity & position
    ↓
Set grounded/hitHead flags
    ↓
Update X3D transform
```

### Why This Architecture?

- **TypeScript**: 
  - Explicit typing everywhere (`private x: number`, `foo(): void`)
  - Interfaces for configuration (`PlayerConfig`, `CameraConfig`)
  - Type-safe method signatures prevent errors
  - Better IDE autocomplete and refactoring
  
- **Modular Design**:
  - Each class has single responsibility
  - Engine code is reusable across projects
  - Entities are easy to extend/customize
  - Game layer separates business logic from rendering
  
- **Configuration Pattern**:
  - Default configs with `Partial<T>` for overrides
  - Static readonly constants for defaults
  - Easy to tweak physics without code changes
  
- **Encapsulation**:
  - Private fields with public getters/setters
  - Methods clearly marked as private/public
  - Internal state protected from external modification
  
- **Vite**: Fast hot-reload during development, optimized production builds
- **X3DOM**: Declarative 3D in browser without WebGL boilerplate
- **AABB Physics**: Simple but effective for platformer gameplay
- **Fixed Camera**: 2.5D view provides depth while keeping controls intuitive

## Future Development

### Short-term Enhancements

- [ ] **Question Blocks**: Hit from below to spawn power-ups (use `hitHead` flag)
- [ ] **Enemy Entities**: Add patrolling enemies with AI and collision
- [ ] **Moving Platforms**: Time-based translation with sine wave motion
- [ ] **Sound Effects**: Web Audio API for jump, coin collect, landing
- [ ] **Particle Effects**: Coin sparkles using X3D particle systems
- [ ] **Level Boundaries**: Kill zones and respawn system
- [ ] **Double Jump**: Track jump count in Player state
- [ ] **Coyote Time**: Grace period for jumping after leaving platform
- [ ] **Input Buffer**: Queue jump inputs for responsive controls

### Medium-term Features

- [ ] **Level System**: JSON-based level data with `LevelLoader` expansion
- [ ] **Power-ups**: New entity classes extending base `Collectible` interface
- [ ] **Checkpoints**: Save state to localStorage with serialization
- [ ] **Lives/Health**: Extend `GameState` with health management
- [ ] **Best Times**: Leaderboard system with time comparisons
- [ ] **Animations**: X3D interpolators for smooth rotations/scaling
- [ ] **Mobile Controls**: Touch event handlers in `Input` class
- [ ] **State Persistence**: Save/load game progress
- [ ] **Multiple Characters**: Player skins with config variations

### Long-term Goals

- [ ] **Level Editor**: In-browser tool for creating custom levels
- [ ] **Multiplayer**: WebRTC for cooperative/competitive play
- [ ] **Leaderboards**: Global high scores
- [ ] **Procedural Generation**: Random level creation
- [ ] **Advanced Physics**: Slopes, conveyor belts, springs
- [ ] **Custom Shaders**: Cel-shading, outline effects
- [ ] **Narrative Elements**: Story progression, cutscenes

## Controls

- **←→ (Arrow Keys)** - Move left/right
- **Space** - Jump

## Technical Requirements

- Modern browser with WebGL support
- JavaScript enabled
- Recommended: Chrome, Firefox, Edge (latest versions)

## License

MIT
