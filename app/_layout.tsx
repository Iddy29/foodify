import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, Redirect, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import ToastProvider from '@/components/Toast';
import { Colors } from '@/constants/theme';

// Custom hook to handle auth routing
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isLoaded = useAuthStore((s) => s.isLoaded);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!token && !inAuthGroup) {
      // Not logged in and not on auth screen - redirect to login
      router.replace('/login');
    } else if (token && inAuthGroup) {
      // Logged in but on auth screen - redirect to home
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoaded, router]);

  return { isLoaded, token };
}

export default function RootLayout() {
  const loadCart = useCartStore((s) => s.loadFromStorage);
  const loadFavorites = useFavoritesStore((s) => s.loadFromStorage);
  const setupNotifications = useNotificationStore((s) => s.setupNotifications);
  const updateBadgeCount = useNotificationStore((s) => s.updateBadgeCount);
  const loadAuth = useAuthStore((s) => s.loadFromStorage);

  const { isLoaded, token } = useProtectedRoute();

  useEffect(() => {
    loadAuth();
    loadCart();
    loadFavorites();
    setupNotifications();
  }, [loadAuth, loadCart, loadFavorites, setupNotifications]);

  // Keep app badge count in sync with active orders + cart items
  useEffect(() => {
    const unsubscribe = useCartStore.subscribe((state) => {
      const activeOrders = state.orders.filter((o) => o.status !== 'arrived').length;
      const cartItems = state.items.reduce((c, i) => c + i.quantity, 0);
      updateBadgeCount(activeOrders + cartItems);
    });
    return () => unsubscribe();
  }, [updateBadgeCount]);

  // Wait for AsyncStorage to be read before deciding anything
  if (!isLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth Screens - accessible when logged out */}
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
        
        {/* Main App Screens - accessible when logged in */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="profile"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="restaurant/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="food/[restaurantId]/[itemId]"
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="checkout"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="order-tracking/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ai-assistant"
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="admin"
          options={{ animation: 'slide_from_right', headerShown: false }}
        />
      </Stack>
      <ToastProvider />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
