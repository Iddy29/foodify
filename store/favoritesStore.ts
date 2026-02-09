import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = '@foodify_favorites';

interface FavoriteItem {
  type: 'restaurant' | 'dish';
  id: string;
  restaurantId?: string; // For dishes - which restaurant they belong to
}

interface FavoritesState {
  favorites: FavoriteItem[];
  isLoaded: boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (type: 'restaurant' | 'dish', id: string) => boolean;
  getFavoriteRestaurantIds: () => string[];
  getFavoriteDishIds: () => string[];
  loadFromStorage: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoaded: false,

  toggleFavorite: (item: FavoriteItem) => {
    const { favorites } = get();
    const exists = favorites.some(
      (f) => f.type === item.type && f.id === item.id
    );

    let newFavorites: FavoriteItem[];
    if (exists) {
      newFavorites = favorites.filter(
        (f) => !(f.type === item.type && f.id === item.id)
      );
    } else {
      newFavorites = [...favorites, item];
    }

    set({ favorites: newFavorites });
    saveFavoritesToStorage(newFavorites);
  },

  isFavorite: (type: 'restaurant' | 'dish', id: string) => {
    return get().favorites.some((f) => f.type === type && f.id === id);
  },

  getFavoriteRestaurantIds: () => {
    return get()
      .favorites.filter((f) => f.type === 'restaurant')
      .map((f) => f.id);
  },

  getFavoriteDishIds: () => {
    return get()
      .favorites.filter((f) => f.type === 'dish')
      .map((f) => f.id);
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      const favorites = data ? JSON.parse(data) : [];
      set({ favorites, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));

async function saveFavoritesToStorage(favorites: FavoriteItem[]) {
  try {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Silently fail
  }
}
