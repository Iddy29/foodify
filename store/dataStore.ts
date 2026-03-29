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
  menu_items_count?: number;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  ingredients: string[] | null;
  sizes: { name: string; price: number }[] | null;
  popular: boolean;
}

export interface RestaurantWithMenu extends Restaurant {
  menu_categories: string[] | null;
  menu_items: MenuItem[];
}

interface DataState {
  // Data
  categories: Category[];
  restaurants: Restaurant[];
  featuredRestaurants: Restaurant[];
  popularRestaurants: Restaurant[];
  currentRestaurant: RestaurantWithMenu | null;
  searchResults: {
    restaurants: Restaurant[];
    menu_items: MenuItem[];
    query: string;
  } | null;

  // Loading states
  isLoadingCategories: boolean;
  isLoadingRestaurants: boolean;
  isLoadingRestaurant: boolean;
  isLoadingSearch: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchRestaurants: (filters?: { featured?: boolean; category?: string; search?: string }) => Promise<void>;
  fetchFeaturedRestaurants: () => Promise<void>;
  fetchPopularRestaurants: () => Promise<void>;
  fetchRestaurant: (id: number | string) => Promise<void>;
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
  restaurants: [],
  featuredRestaurants: [],
  popularRestaurants: [],
  currentRestaurant: null,
  searchResults: null,
  isLoadingCategories: false,
  isLoadingRestaurants: false,
  isLoadingRestaurant: false,
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

  fetchRestaurants: async (filters = {}) => {
    set({ isLoadingRestaurants: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.featured) params.append('featured', '1');
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const query = params.toString() ? `?${params.toString()}` : '';
      const restaurants = await apiGet<Restaurant[]>(`/api/restaurants${query}`);
      set({ restaurants, isLoadingRestaurants: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch restaurants.',
        isLoadingRestaurants: false,
      });
    }
  },

  fetchFeaturedRestaurants: async () => {
    try {
      const featuredRestaurants = await apiGet<Restaurant[]>('/api/featured-restaurants');
      set({ featuredRestaurants });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch featured restaurants.' });
    }
  },

  fetchPopularRestaurants: async () => {
    try {
      const popularRestaurants = await apiGet<Restaurant[]>('/api/popular-restaurants');
      set({ popularRestaurants });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch popular restaurants.' });
    }
  },

  fetchRestaurant: async (id) => {
    set({ isLoadingRestaurant: true, error: null, currentRestaurant: null });
    try {
      const restaurant = await apiGet<RestaurantWithMenu>(`/api/restaurants/${id}`);
      set({ currentRestaurant: restaurant, isLoadingRestaurant: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch restaurant details.',
        isLoadingRestaurant: false,
      });
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
        restaurants: Restaurant[];
        menu_items: (MenuItem & { restaurant?: { id: number; name: string } })[];
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
