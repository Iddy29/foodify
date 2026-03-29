import { create } from 'zustand';
import { useAuthStore } from './authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.210.226.214:8000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Driver {
  id: number;
  user_id: number;
  vehicle_type: 'bike' | 'car' | 'scooter';
  vehicle_number: string;
  license_number: string;
  phone: string;
  is_approved: boolean;
  approved_at: string | null;
  rejection_reason: string | null;
  is_online: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_at: string | null;
  total_deliveries: number;
  rating: number;
  review_count: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TrackingInfo {
  order_number: string;
  status: string;
  is_trackable: boolean;
  driver: {
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
    location_updated_at: string;
  } | null;
  delivery_address: string;
  estimated_arrival: string | null;
  created_at: string;
}

export interface DriverOrder {
  id: number;
  order_number: string;
  user_id: number;
  status: string;
  total: number;
  delivery_address: string;
  items: any[];
  user?: {
    id: number;
    name: string;
    phone: string;
  };
}

interface TrackingState {
  // Driver State
  driverProfile: Driver | null;
  activeOrder: DriverOrder | null;
  availableOrders: DriverOrder[];
  isDriver: boolean;
  
  // Tracking State
  trackingInfo: TrackingInfo | null;
  isTracking: boolean;
  
  // Loading States
  isLoading: boolean;
  isUpdatingLocation: boolean;
  error: string | null;
  
  // Actions - Driver
  fetchDriverProfile: () => Promise<void>;
  onboardDriver: (data: {
    vehicle_type: string;
    vehicle_number: string;
    license_number: string;
    phone: string;
  }) => Promise<void>;
  goOnline: (latitude: number, longitude: number) => Promise<void>;
  goOffline: () => Promise<void>;
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
  fetchAvailableOrders: () => Promise<void>;
  acceptOrder: (orderId: number) => Promise<void>;
  fetchActiveOrder: () => Promise<void>;
  updateOrderStatus: (orderId: number, status: string, notes?: string) => Promise<void>;
  
  // Actions - Customer Tracking
  fetchTrackingInfo: (trackingKey: string) => Promise<void>;
  startTracking: (orderId: number, interval?: number) => void;
  stopTracking: () => void;
  
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
    throw new Error(firstError ?? 'Something went wrong.');
  }

  return json as T;
}

// ─── Store ────────────────────────────────────────────────────────────────────

let trackingInterval: NodeJS.Timeout | null = null;

export const useTrackingStore = create<TrackingState>((set, get) => ({
  // Initial State
  driverProfile: null,
  activeOrder: null,
  availableOrders: [],
  isDriver: false,
  trackingInfo: null,
  isTracking: false,
  isLoading: false,
  isUpdatingLocation: false,
  error: null,

  clearError: () => set({ error: null }),

  // ─── Driver Actions ───────────────────────────────────────────────────────
  
  fetchDriverProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await apiRequest<Driver>('/api/driver/profile');
      set({ 
        driverProfile: profile, 
        isDriver: true,
        isLoading: false 
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        set({ isDriver: false, isLoading: false });
      } else {
        set({ 
          error: err instanceof Error ? err.message : 'Failed to fetch profile.',
          isLoading: false 
        });
      }
    }
  },

  onboardDriver: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest('/api/driver/onboard', 'POST', data);
      await get().fetchDriverProfile();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Onboarding failed.',
        isLoading: false,
      });
      throw err;
    }
  },

  goOnline: async (latitude, longitude) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest('/api/driver/go-online', 'POST', { latitude, longitude });
      await get().fetchDriverProfile();
      await get().fetchAvailableOrders();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to go online.',
        isLoading: false,
      });
      throw err;
    }
  },

  goOffline: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest('/api/driver/go-offline', 'POST');
      await get().fetchDriverProfile();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to go offline.',
        isLoading: false,
      });
      throw err;
    }
  },

  updateLocation: async (latitude, longitude) => {
    // Don't set loading state for frequent updates
    try {
      set({ isUpdatingLocation: true });
      await apiRequest('/api/driver/location', 'POST', { 
        latitude, 
        longitude,
        accuracy: 10,
      });
      set({ isUpdatingLocation: false });
    } catch (err) {
      set({ isUpdatingLocation: false });
      // Silently fail for location updates
    }
  },

  fetchAvailableOrders: async () => {
    try {
      const orders = await apiRequest<DriverOrder[]>('/api/driver/available-orders');
      set({ availableOrders: orders });
    } catch (err) {
      // Silently fail
    }
  },

  acceptOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest(`/api/driver/orders/${orderId}/accept`, 'POST');
      await get().fetchActiveOrder();
      set({ availableOrders: [], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to accept order.',
        isLoading: false,
      });
      throw err;
    }
  },

  fetchActiveOrder: async () => {
    try {
      const result = await apiRequest<{ order: DriverOrder | null }>('/api/driver/active-order');
      set({ activeOrder: result.order });
    } catch (err) {
      set({ activeOrder: null });
    }
  },

  updateOrderStatus: async (orderId, status, notes) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest(`/api/driver/orders/${orderId}/status`, 'PATCH', { status, notes });
      await get().fetchActiveOrder();
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update status.',
        isLoading: false,
      });
      throw err;
    }
  },

  // ─── Customer Tracking Actions ────────────────────────────────────────────
  
  fetchTrackingInfo: async (trackingKey) => {
    try {
      const info = await apiRequest<TrackingInfo>(`/api/track/${trackingKey}`);
      set({ trackingInfo: info });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Tracking not found.',
      });
    }
  },

  startTracking: (orderId, interval = 5000) => {
    // Stop any existing tracking
    get().stopTracking();
    
    set({ isTracking: true });
    
    // Poll for updates every 5 seconds
    trackingInterval = setInterval(async () => {
      try {
        const order = await apiRequest<{ tracking_key: string }>(`/api/orders/${orderId}`);
        if (order.tracking_key) {
          await get().fetchTrackingInfo(order.tracking_key);
        }
      } catch (err) {
        // Stop tracking on error
        get().stopTracking();
      }
    }, interval);
  },

  stopTracking: () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
    set({ isTracking: false });
  },
}));
