// Saved progress (per browser). Every read/write is guarded: private windows
// and locked-down school devices can block localStorage.

export interface Save {
  hat: string;
  seenIntro: boolean;
  voice: boolean;
  sound: boolean;
  stars: Record<string, number>; // level id -> best stars (1..3)
  items: string[]; // unlocked powers, e.g. 'flip'
  seen: string[]; // one-time story beats already shown
}

const KEY = 'raccoon-heist-v1';
const DEFAULTS: Save = { hat: 'beanie', seenIntro: false, voice: true, sound: true, stars: {}, items: [], seen: [] };

function load(): Save {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

let data: Save = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* progress just won't survive a reload */
  }
}

/** `?all` in the URL unlocks every level (handy for teachers). */
export const unlockAll = typeof location !== 'undefined' && new URLSearchParams(location.search).has('all');

export const store = {
  get: () => data,
  set(patch: Partial<Save>) {
    data = { ...data, ...patch };
    persist();
  },
  stars: (levelId: string) => data.stars[levelId] ?? 0,
  setStars(levelId: string, n: number) {
    if (n > (data.stars[levelId] ?? 0)) store.set({ stars: { ...data.stars, [levelId]: n } });
  },
  has: (item: string) => data.items.includes(item),
  give(item: string) {
    if (!data.items.includes(item)) store.set({ items: [...data.items, item] });
  },
  seen: (flag: string) => data.seen.includes(flag),
  markSeen(flag: string) {
    if (!data.seen.includes(flag)) store.set({ seen: [...data.seen, flag] });
  },
  reset() {
    data = { ...DEFAULTS };
    persist();
  },
};
