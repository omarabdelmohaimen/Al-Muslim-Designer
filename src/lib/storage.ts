import { MediaItem } from "@/types/media";

const FAVORITES_KEY = "amm_favorites";
const RECENT_KEY = "amm_recent";

const safeRead = (key: string): string[] => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWrite = (key: string, data: string[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getFavoriteIds = () => safeRead(FAVORITES_KEY);

export const toggleFavorite = (id: string) => {
  const ids = getFavoriteIds();
  const exists = ids.includes(id);
  const next = exists ? ids.filter((x) => x !== id) : [id, ...ids];
  safeWrite(FAVORITES_KEY, next.slice(0, 200));
  return !exists;
};

export const getRecentIds = () => safeRead(RECENT_KEY);

export const addRecent = (id: string) => {
  const ids = getRecentIds().filter((x) => x !== id);
  safeWrite(RECENT_KEY, [id, ...ids].slice(0, 30));
};

export const mapByIds = (items: MediaItem[], ids: string[]) => {
  const set = new Set(ids);
  return items.filter((i) => set.has(i.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
};
