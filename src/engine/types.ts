// ============================================================================
// Core geometric types
// ============================================================================

/**
 * 2D Vector
 */
export type Vec2 = { x: number; y: number };

/**
 * 3D Vector
 */
export type Vec3 = { x: number; y: number; z: number };

/**
 * Axis-Aligned Bounding Box (AABB)
 * Represents a 3D box with center position (x, y, z) and dimensions (w, h, d)
 */
export type AABB = { 
  x: number;  // Center X
  y: number;  // Center Y
  z: number;  // Center Z
  w: number;  // Width (X dimension)
  h: number;  // Height (Y dimension)
  d: number;  // Depth (Z dimension)
};

// ============================================================================
// Helper functions for AABB
// ============================================================================

/**
 * Creates an AABB from center position and size
 */
export function createAABB(center: Vec3, size: Vec3): AABB {
  return {
    x: center.x,
    y: center.y,
    z: center.z,
    w: size.x,
    h: size.y,
    d: size.z
  };
}

/**
 * Creates an AABB from explicit parameters
 */
export function aabb(x: number, y: number, z: number, w: number, h: number, d: number): AABB {
  return { x, y, z, w, h, d };
}
