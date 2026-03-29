import { create } from 'zustand';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.210.226.214:8000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  image: string | null;
}

export interface Restaurant {
  id: number;
  name: string;
  image: string | null;
  cover_image: string | null;
  rating: number;
  review_count: number;
  delivery_time: string;
  delivery_fee: number;
  distance: string | null;
  cuisine: string[];
  price_range: string;
  address: string;
  description: string;
  featured: boolean;
  menu_categories: string[] | null;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  ingredients: string[] | null;
  sizes: { name: string; price: number }[] | null;
  popular: boolean;
  is_active: boolean;
}

interface DataState {
  // Data
  categories: Category[];
  restaurant: Restaurant | null;
  menuItems: MenuItem[];
  popularItems: MenuItem[];
  searchResults: {
    menu_items: MenuItem[];
    query: string;
  } | null;

  // Loading states
  isLoadingCategories: boolean;
  isLoadingRestaurant: boolean;
  isLoadingMenuItems: boolean;
  isLoadingSearch: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchRestaurant: () => Promise<void>;
  fetchMenuItems: (filters?: { category?: string; popular?: boolean; search?: string }) => Promise<void>;
  fetchPopularItems: () => Promise<void>;
  search: (query: string) => Promise<void>;
  clearError: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiGet<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    const message = json?.message || 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return json as T;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDataStore = create<DataState>((set) => ({
  // Initial state
  categories: [],
  restaurant: null,
  menuItems: [],
  popularItems: [],
  searchResults: null,
  isLoadingCategories: false,
  isLoadingRestaurant: false,
  isLoadingMenuItems: false,
  isLoadingSearch: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCategories: async () => {
    set({ isLoadingCategories: true, error: null });
    try {
      const categories = await apiGet<Category[]>('/api/categories');
      set({ categories, isLoadingCategories: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch categories.',
        isLoadingCategories: false,
      });
    }
  },

  fetchRestaurant: async () => {
    set({ isLoadingRestaurant: true, error: null });
    try {
      const restaurant = await apiGet<Restaurant>('/api/restaurant');
      set({ restaurant, isLoadingRestaurant: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch restaurant.',
        isLoadingRestaurant: false,
      });
    }
  },

  fetchMenuItems: async (filters = {}) => {
    set({ isLoadingMenuItems: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.popular) params.append('popular', '1');
      if (filters.search) params.append('search', filters.search);

      const query = params.toString() ? `?${params.toString()}` : '';
      const menuItems = await apiGet<MenuItem[]>(`/api/menu-items${query}`);
      set({ menuItems, isLoadingMenuItems: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch menu items.',
        isLoadingMenuItems: false,
      });
    }
  },

  fetchPopularItems: async () => {
    try {
      const popularItems = await apiGet<MenuItem[]>('/api/popular-items');
      set({ popularItems });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch popular items.' });
    }
  },

  search: async (query) => {
    if (!query.trim()) {
      set({ searchResults: null });
      return;
    }

    set({ isLoadingSearch: true, error: null });
    try {
      const results = await apiGet<{
        menu_items: MenuItem[];
        query: string;
      }>(`/api/search?q=${encodeURIComponent(query)}`);
      set({ searchResults: results, isLoadingSearch: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Search failed.',
        isLoadingSearch: false,
      });
    }
  },
}));
