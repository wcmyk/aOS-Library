import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const BASE_URL = import.meta.env.BASE_URL;

export type Wallpaper = { id: string; name: string; file: string };

/** The bundled wallpaper (shipped originally) plus 10 generated options. */
export const WALLPAPERS: Wallpaper[] = [
  { id: 'default', name: 'aOS Default', file: `${BASE_URL}assets/wallpaper.jpg` },
  { id: 'ribbons', name: 'Aurora Ribbons', file: `${BASE_URL}assets/wallpapers/ribbons.jpg` },
  { id: 'aurora', name: 'Northern Lights', file: `${BASE_URL}assets/wallpapers/aurora.jpg` },
  { id: 'ridges', name: 'Dawn Ridges', file: `${BASE_URL}assets/wallpapers/ridges.jpg` },
  { id: 'nebula', name: 'Deep Space', file: `${BASE_URL}assets/wallpapers/nebula.jpg` },
  { id: 'dunes', name: 'Sunset Dunes', file: `${BASE_URL}assets/wallpapers/dunes.jpg` },
  { id: 'chrome', name: 'Liquid Chrome', file: `${BASE_URL}assets/wallpapers/chrome.jpg` },
  { id: 'forest', name: 'Misty Forest', file: `${BASE_URL}assets/wallpapers/forest.jpg` },
  { id: 'lowpoly', name: 'Low-Poly Peaks', file: `${BASE_URL}assets/wallpapers/lowpoly.jpg` },
  { id: 'ocean', name: 'Turquoise Tide', file: `${BASE_URL}assets/wallpapers/ocean.jpg` },
  { id: 'gradient', name: 'Ember Glow', file: `${BASE_URL}assets/wallpapers/gradient.jpg` },
  { id: 'city', name: 'Blue Hour City', file: `${BASE_URL}assets/wallpapers/city.jpg` },
];

export const wallpaperById = (id: string): Wallpaper =>
  WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];

type WallpaperStore = {
  selectedId: string;
  setWallpaper: (id: string) => void;
};

export const useWallpaperStore = create<WallpaperStore>()(
  persist(
    (set) => ({
      selectedId: 'default',
      setWallpaper: (id) => set({ selectedId: id }),
    }),
    { name: 'aos-wallpaper-store' },
  ),
);
