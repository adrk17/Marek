export interface PlayerProfile {
  nickname: string;
}

export interface LeaderboardEntry {
  nickname: string;
  time: number; // seconds
  coins: number;
  heightBonus: number;
  score: number;
  timestamp: number;
}

export interface RunResult {
  levelId: string;
  nickname: string;
  time: number;
  coins: number;
  heightBonus: number;
}

const PROFILE_KEY = 'marek.profile';
const LEADERBOARD_KEY = 'marek.leaderboards';
const LEADERBOARD_LIMIT = 20;

interface LeaderboardStore {
  [levelId: string]: LeaderboardEntry[];
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write localStorage key "${key}":`, error);
  }
}

export function getProfile(): PlayerProfile {
  const stored = readJSON<PlayerProfile | null>(PROFILE_KEY, null);
  if (!stored || !stored.nickname?.trim()) {
    return { nickname: 'Guest' };
  }
  return stored;
}

export function saveProfile(profile: PlayerProfile): void {
  const nickname = profile.nickname.trim();
  const sanitized: PlayerProfile = { nickname: nickname || 'Guest' };
  writeJSON(PROFILE_KEY, sanitized);
}

export function getLeaderboard(levelId: string): LeaderboardEntry[] {
  const store = readJSON<LeaderboardStore>(LEADERBOARD_KEY, {});
  return store[levelId]?.slice() ?? [];
}

// --- Global scoring constants ---
const SCORE_A = 1000;   // base scale for the time component
const SCORE_T_UNIT = 50; // time normalization unit (seconds)
const SCORE_T0 = 8;      // small buffer to avoid extreme scores at very low T
const SCORE_K = 1.5;     // time sensitivity (higher = stronger reward for fast runs)
const SCORE_B = 10;      // weight of the height bonus (applies before coin multiplier)
const SCORE_ALPHA = 0.20; // +20% per coin as a total multiplier
const SCORE_M_MAX = 3.0;  // cap for the total coin multiplier

function computeScore(time: number, coins: number, heightBonus: number): number {
  // Time is the primary factor; lower is better. T0 prevents runaway scores near 0.
  const T = Math.max(0, time);
  // Time term: A * (T_UNIT / (T + T0))^K
  const timeTerm = SCORE_A * Math.pow(SCORE_T_UNIT / (T + SCORE_T0), SCORE_K);
  // Height adds a small, readable bonus before coin multiplier
  const base = timeTerm + SCORE_B * heightBonus;
  // Coins multiply the whole performance, with a sensible cap
  const coinMult = Math.min(1 + SCORE_ALPHA * Math.max(0, coins), SCORE_M_MAX);

  return Math.round(base * coinMult);
}

export function recordResult(result: RunResult): LeaderboardEntry[] {
  const store = readJSON<LeaderboardStore>(LEADERBOARD_KEY, {});
  const { levelId, nickname, time, coins, heightBonus } = result;
  const entries = store[levelId]?.slice() ?? [];
  const finalScore = computeScore(time, coins, heightBonus);

  const existingIndex = entries.findIndex((entry) => entry.nickname === nickname);
  const newEntry: LeaderboardEntry = {
    nickname,
    time,
    coins,
    heightBonus,
    score: finalScore,
    timestamp: Date.now()
  };

  if (existingIndex >= 0) {
    const existing = entries[existingIndex];
    const betterScore = newEntry.score > existing.score;
    const sameScore = newEntry.score === existing.score;
    const fasterTime = time < existing.time;
    if (betterScore || (sameScore && fasterTime)) {
      entries[existingIndex] = newEntry;
    }
  } else {
    entries.push(newEntry);
  }

  entries.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; // higher score first
    }
    if (a.time !== b.time) {
      return a.time - b.time; // faster time breaks ties
    }
    return a.timestamp - b.timestamp;
  });

  if (entries.length > LEADERBOARD_LIMIT) {
    entries.length = LEADERBOARD_LIMIT;
  }

  store[levelId] = entries;
  writeJSON(LEADERBOARD_KEY, store);
  return entries;
}
