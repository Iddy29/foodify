import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.210.226.214:8000';
const TOKEN_KEY = '@foodify_auth_token';
const USER_KEY = '@foodify_auth_user';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearError: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiPost<T>(
  path: string,
  body: Record<string, string>,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    // Laravel returns 422 validation errors as { message, errors: { field: [msg] } }
    const firstError =
      json?.errors
        ? Object.values(json.errors as Record<string, string[]>)[0]?.[0]
        : json?.message;
    throw new Error(firstError ?? 'Something went wrong. Please try again.');
  }

  return json as T;
}

async function saveSession(token: string, user: AuthUser) {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);
}

async function clearSession() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ]);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoaded: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  loadFromStorage: async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token && userJson) {
        set({ token, user: JSON.parse(userJson), isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  register: async (name, email, password, passwordConfirmation) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiPost<{ user: AuthUser; token: string }>(
        '/api/auth/register',
        {
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        },
      );
      await saveSession(data.token, data.user);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Registration failed.',
      });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiPost<{ user: AuthUser; token: string }>(
        '/api/auth/login',
        { email, password },
      );
      await saveSession(data.token, data.user);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed.',
      });
      throw err;
    }
  },

  logout: async () => {
    const { token } = get();
    set({ isLoading: true, error: null });
    try {
      if (token) {
        // Best-effort — don't block logout if the server call fails
        await apiPost('/api/auth/logout', {}, token).catch(() => {});
      }
    } finally {
      await clearSession();
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
