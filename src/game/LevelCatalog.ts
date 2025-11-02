import type { LevelData } from './ModelLoader';

export interface LevelManifest {
  id: string;
  name: string;
  file: string;
  description?: string;
  difficulty?: string;
  author?: string;
  metadata?: Record<string, unknown>;
}

const CATALOG_URL = '/levels/index.json';

export async function loadLevelCatalog(): Promise<LevelManifest[]> {
  try {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Catalog is not an array');
    }
    return data.map(normalizeEntry);
  } catch (error) {
    console.error('Failed to load level catalog:', error);
    return [];
  }
}

function normalizeEntry(entry: any): LevelManifest {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Invalid catalog entry');
  }
  const id = String(entry.id ?? '').trim();
  const file = String(entry.file ?? '').trim();
  const name = String(entry.name ?? '').trim();
  if (!id || !file || !name) {
    throw new Error('Catalog entry missing required fields');
  }
  return {
    id,
    file,
    name,
    description: entry.description ? String(entry.description) : undefined,
    difficulty: entry.difficulty ? String(entry.difficulty) : undefined,
    author: entry.author ? String(entry.author) : undefined,
    metadata: entry.metadata && typeof entry.metadata === 'object'
      ? { ...entry.metadata }
      : undefined
  };
}

export async function loadLevelData(manifest: LevelManifest): Promise<LevelData> {
  const response = await fetch(manifest.file);
  if (!response.ok) {
    throw new Error(`Failed to load level file "${manifest.file}" (HTTP ${response.status})`);
  }
  const level = await response.json() as LevelData;
  return {
    ...level,
    name: level.name ?? manifest.name
  };
}

