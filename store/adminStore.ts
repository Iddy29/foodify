import { create } from 'zustand';
import { useAuthStore } from './authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.210.226.214:8000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
  restaurant?: { id: number; name: string };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone: string | null;
  avatar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  order_number: string;
  items: {
    menuItem: {
      id: number;
      name: string;
      price: number;
      image?: string;
    };
    quantity: number;
    selectedSize: {
      name: string;
      price: number;
    };
    specialInstructions?: string;
  }[];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  delivery_address: string;
  payment_method: string;
  special_instructions: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string; email: string };
  restaurant?: { id: number; name: string };
}

export interface OrderStats {
  total_orders: number;
  today_orders: number;
  month_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  on_the_way_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  today_revenue: number;
}

export interface DashboardStats {
  total_users: number;
  total_customers: number;
  total_admins: number;
  total_restaurants: number;
  total_menu_items: number;
  total_categories: number;
  active_restaurants: number;
  featured_restaurants: number;
  recent_users: User[];
  recent_restaurants: Restaurant[];
}

interface AdminState {
  // Data
  categories: Category[];
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  users: User[];
  orders: Order[];
  orderStats: OrderStats | null;
  dashboardStats: DashboardStats | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingCategories: boolean;
  isLoadingRestaurants: boolean;
  isLoadingMenuItems: boolean;
  isLoadingUsers: boolean;
  isLoadingOrders: boolean;
  error: string | null;
  
  // Actions - Dashboard
  fetchDashboardStats: () => Promise<void>;
  
  // Actions - Categories
  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<Category>, imageFile?: { uri: string; name: string; type: string }) => Promise<void>;
  updateCategory: (id: number, data: Partial<Category>, imageFile?: { uri: string; name: string; type: string }) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  toggleCategory: (id: number) => Promise<void>;
  
  // Actions - Restaurants
  fetchRestaurants: () => Promise<void>;
  createRestaurant: (data: Partial<Restaurant>, imageFiles?: { image?: { uri: string; name: string; type: string }; cover_image?: { uri: string; name: string; type: string } }) => Promise<void>;
  updateRestaurant: (id: number, data: Partial<Restaurant>, imageFiles?: { image?: { uri: string; name: string; type: string }; cover_image?: { uri: string; name: string; type: string } }) => Promise<void>;
  deleteRestaurant: (id: number) => Promise<void>;
  toggleRestaurant: (id: number) => Promise<void>;
  toggleRestaurantFeatured: (id: number) => Promise<void>;
  
  // Actions - Menu Items
  fetchMenuItems: (restaurantId?: number) => Promise<void>;
  createMenuItem: (data: Partial<MenuItem>, imageFile?: { uri: string; name: string; type: string }) => Promise<void>;
  updateMenuItem: (id: number, data: Partial<MenuItem>, imageFile?: { uri: string; name: string; type: string }) => Promise<void>;
  deleteMenuItem: (id: number) => Promise<void>;
  toggleMenuItem: (id: number) => Promise<void>;
  toggleMenuItemPopular: (id: number) => Promise<void>;
  
  // Actions - Users
  fetchUsers: () => Promise<void>;
  createUser: (data: Partial<User> & { password: string }) => Promise<void>;
  updateUser: (id: number, data: Partial<User> & { password?: string }) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  toggleUser: (id: number) => Promise<void>;

  // Actions - Orders
  fetchOrders: (filters?: { status?: string; user_id?: number; restaurant_id?: number; search?: string }) => Promise<void>;
  fetchOrderStats: () => Promise<void>;
  updateOrderStatus: (id: number, status: string, estimatedDelivery?: string) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  
  clearError: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiRequest<T>(
  path: string,
  method: string = 'GET',
  body?: Record<string, unknown>,
): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();

  if (!res.ok) {
    const firstError =
      json?.errors
        ? Object.values(json.errors as Record<string, string[]>)[0]?.[0]
        : json?.message;
    throw new Error(firstError ?? 'Something went wrong. Please try again.');
  }

  return json as T;
}

/**
 * Helper for multipart/form-data requests (file uploads).
 */
async function apiRequestFormData<T>(
  path: string,
  method: string = 'POST',
  formData: FormData,
): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Note: Don't set Content-Type for FormData - browser/fetch will set it with boundary

  const options: RequestInit = {
    method,
    headers,
    body: formData,
  };

  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();

  if (!res.ok) {
    const firstError =
      json?.errors
        ? Object.values(json.errors as Record<string, string[]>)[0]?.[0]
        : json?.message;
    throw new Error(firstError ?? 'Something went wrong. Please try again.');
  }

  return json as T;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  categories: [],
  restaurants: [],
  menuItems: [],
  users: [],
  orders: [],
  orderStats: null,
  dashboardStats: null,
  isLoading: false,
  isLoadingCategories: false,
  isLoadingRestaurants: false,
  isLoadingMenuItems: false,
  isLoadingUsers: false,
  isLoadingOrders: false,
  error: null,

  clearError: () => set({ error: null }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await apiRequest<DashboardStats>('/api/admin/dashboard');
      set({ dashboardStats: stats, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch dashboard stats.',
        isLoading: false,
      });
    }
  },

  // ─── Categories ────────────────────────────────────────────────────────────
  fetchCategories: async () => {
    set({ isLoadingCategories: true, error: null });
    try {
      const response = await apiRequest<{ data: Category[] }>('/api/admin/categories/all');
      set({ categories: response.data || response as unknown as Category[], isLoadingCategories: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch categories.',
        isLoadingCategories: false,
      });
    }
  },

  createCategory: async (data, imageFile?: { uri: string; name: string; type: string }) => {
    set({ isLoading: true, error: null });
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('name', data.name || '');
        formData.append('icon', data.icon || '');
        formData.append('sort_order', String(data.sort_order ?? 0));
        formData.append('is_active', String(data.is_active ?? true));
        formData.append('image', imageFile as unknown as Blob);
        await apiRequestFormData('/api/admin/categories', 'POST', formData);
      } else {
        await apiRequest('/api/admin/categories', 'POST', data);
      }
      await get().fetchCategories();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create category.',
        isLoading: false,
      });
      throw err;
    }
  },

  updateCategory: async (id, data, imageFile?: { uri: string; name: string; type: string }) => {
    set({ isLoading: true, error: null });
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('name', data.name || '');
        formData.append('icon', data.icon || '');
        formData.append('sort_order', String(data.sort_order ?? 0));
        formData.append('is_active', String(data.is_active ?? true));
        formData.append('image', imageFile as unknown as Blob);
        // Use POST with _method=PUT for Laravel to handle file uploads on PUT
        formData.append('_method', 'PUT');
        await apiRequestFormData(`/api/admin/categories/${id}`, 'POST', formData);
      } else {
        await apiRequest(`/api/admin/categories/${id}`, 'PUT', data);
      }
      await get().fetchCategories();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update category.',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest(`/api/admin/categories/${id}`, 'DELETE');
      await get().fetchCategories();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete category.',
        isLoading: false,
      });
      throw err;
    }
  },

  toggleCategory: async (id) => {
    try {
      await apiRequest(`/api/admin/categories/${id}/toggle`, 'PATCH');
      await get().fetchCategories();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to toggle category.' });
      throw err;
    }
  },

  // ─── Restaurants ───────────────────────────────────────────────────────────
  fetchRestaurants: async () => {
    set({ isLoadingRestaurants: true, error: null });
    try {
      const response = await apiRequest<{ data: Restaurant[] }>('/api/admin/restaurants');
      set({ restaurants: response.data || response as unknown as Restaurant[], isLoadingRestaurants: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch restaurants.',
        isLoadingRestaurants: false,
      });
    }
  },

  createRestaurant: async (data, imageFiles?: { image?: { uri: string; name: string; type: string }; cover_image?: { uri: string; name: string; type: string } }) => {
    set({ isLoading: true, error: null });
    try {
      if (imageFiles && (imageFiles.image || imageFiles.cover_image)) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        if (imageFiles.image) {
          formData.append('image', imageFiles.image as unknown as Blob);
        }
        if (imageFiles.cover_image) {
          formData.append('cover_image', imageFiles.cover_image as unknown as Blob);
        }
        await apiRequestFormData('/api/admin/restaurants', 'POST', formData);
      } else {
        await apiRequest('/api/admin/restaurants', 'POST', data);
      }
      await get().fetchRestaurants();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create restaurant.',
        isLoading: false,
      });
      throw err;
    }
  },

  updateRestaurant: async (id, data, imageFiles?: { image?: { uri: string; name: string; type: string }; cover_image?: { uri: string; name: string; type: string } }) => {
    set({ isLoading: true, error: null });
    try {
      if (imageFiles && (imageFiles.image || imageFiles.cover_image)) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        if (imageFiles.image) {
          formData.append('image', imageFiles.image as unknown as Blob);
        }
        if (imageFiles.cover_image) {
          formData.append('cover_image', imageFiles.cover_image as unknown as Blob);
        }
        formData.append('_method', 'PUT');
        await apiRequestFormData(`/api/admin/restaurants/${id}`, 'POST', formData);
      } else {
        await apiRequest(`/api/admin/restaurants/${id}`, 'PUT', data);
      }
      await get().fetchRestaurants();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update restaurant.',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteRestaurant: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest(`/api/admin/restaurants/${id}`, 'DELETE');
      await get().fetchRestaurants();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete restaurant.',
        isLoading: false,
      });
      throw err;
    }
  },

  toggleRestaurant: async (id) => {
    try {
      await apiRequest(`/api/admin/restaurants/${id}/toggle`, 'PATCH');
      await get().fetchRestaurants();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to toggle restaurant.' });
      throw err;
    }
  },

  toggleRestaurantFeatured: async (id) => {
    try {
      await apiRequest(`/api/admin/restaurants/${id}/toggle-featured`, 'PATCH');
      await get().fetchRestaurants();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to toggle featured status.' });
      throw err;
    }
  },

  // ─── Menu Items ────────────────────────────────────────────────────────────
  fetchMenuItems: async (restaurantId) => {
    set({ isLoadingMenuItems: true, error: null });
    try {
      const url = restaurantId 
        ? `/api/admin/restaurants/${restaurantId}/menu-items`
        : '/api/admin/menu-items';
      const response = await apiRequest<{ data: MenuItem[] }>(url);
      set({ menuItems: response.data || response as unknown as MenuItem[], isLoadingMenuItems: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch menu items.',
        isLoadingMenuItems: false,
      });
    }
  },

  createMenuItem: async (data, imageFile?: { uri: string; name: string; type: string }) => {
    set({ isLoading: true, error: null });
    try {
      if (imageFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        formData.append('image', imageFile as unknown as Blob);
        await apiRequestFormData('/api/admin/menu-items', 'POST', formData);
      } else {
        await apiRequest('/api/admin/menu-items', 'POST', data);
      }
      await get().fetchMenuItems();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create menu item.',
        isLoading: false,
      });
      throw err;
    }
  },

  updateMenuItem: async (id, data, imageFile?: { uri: string; name: string; type: string }) => {
    set({ isLoading: true, error: null });
    try {
      if (imageFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        formData.append('image', imageFile as unknown as Blob);
        formData.append('_method', 'PUT');
        await apiRequestFormData(`/api/admin/menu-items/${id}`, 'POST', formData);
      } else {
        await apiRequest(`/api/admin/menu-items/${id}`, 'PUT', data);
      }
      await get().fetchMenuItems();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update menu item.',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteMenuItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest(`/api/admin/menu-items/${id}`, 'DELETE');
      await get().fetchMenuItems();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete menu item.',
        isLoading: false,
      });
      throw err;
    }
  },

  toggleMenuItem: async (id) => {
    try {
      await apiRequest(`/api/admin/menu-items/${id}/toggle`, 'PATCH');
      await get().fetchMenuItems();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to toggle menu item.' });
      throw err;
    }
  },

  toggleMenuItemPopular: async (id) => {
    try {
      await apiRequest(`/api/admin/menu-items/${id}/toggle-popular`, 'PATCH');
      await get().fetchMenuItems();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to toggle popular status.' });
      throw err;
    }
  },

  // ─── Users ─────────────────────────────────────────────────────────────────
  fetchUsers: async () => {
    set({ isLoadingUsers: true, error: null });
    try {
      const response = await apiRequest<{ data: User[] }>('/api/admin/users');
      set({ users: response.data || response as unknown as User[], isLoadingUsers: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch users.',
        isLoadingUsers: false,
      });
    }
  },

  createUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest('/api/admin/users', 'POST', data);
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create user.',
        isLoading: false,
      });
      throw err;
    }
  },

  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest(`/api/admin/users/${id}`, 'PUT', data);
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update user.',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest(`/api/admin/users/${id}`, 'DELETE');
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete user.',
        isLoading: false,
      });
      throw err;
    }
  },

  toggleUser: async (id) => {
    try {
      await apiRequest(`/api/admin/users/${id}/toggle`, 'PATCH');
      await get().fetchUsers();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to toggle user.' });
      throw err;
    }
  },

  // ─── Orders ────────────────────────────────────────────────────────────────
  fetchOrders: async (filters = {}) => {
    set({ isLoadingOrders: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.user_id) params.append('user_id', filters.user_id.toString());
      if (filters.restaurant_id) params.append('restaurant_id', filters.restaurant_id.toString());
      if (filters.search) params.append('search', filters.search);

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiRequest<{ data: Order[] }>(`/api/admin/orders${query}`);
      set({ orders: response.data || response as unknown as Order[], isLoadingOrders: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch orders.',
        isLoadingOrders: false,
      });
    }
  },

  fetchOrderStats: async () => {
    try {
      const stats = await apiRequest<OrderStats>('/api/admin/orders/stats');
      set({ orderStats: stats });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch order stats.' });
    }
  },

  updateOrderStatus: async (id, status, estimatedDelivery) => {
    set({ isLoading: true, error: null });
    try {
      const data: Record<string, string> = { status };
      if (estimatedDelivery) data.estimated_delivery = estimatedDelivery;
      
      await apiRequest(`/api/admin/orders/${id}/status`, 'PATCH', data);
      await get().fetchOrders();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update order status.',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest(`/api/admin/orders/${id}`, 'DELETE');
      await get().fetchOrders();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete order.',
        isLoading: false,
      });
      throw err;
    }
  },
}));
