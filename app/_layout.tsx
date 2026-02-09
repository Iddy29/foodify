import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useNotificationStore } from '@/store/notificationStore';
import ToastProvider from '@/components/Toast';

export default function RootLayout() {
  const loadCart = useCartStore((s) => s.loadFromStorage);
  const loadFavorites = useFavoritesStore((s) => s.loadFromStorage);
  const setupNotifications = useNotificationStore((s) => s.setupNotifications);
  const updateBadgeCount = useNotificationStore((s) => s.updateBadgeCount);

  useEffect(() => {
    loadCart();
    loadFavorites();
    setupNotifications();
  }, [loadCart, loadFavorites, setupNotifications]);

  // Update badge count when cart or active orders change
  useEffect(() => {
    const unsubscribe = useCartStore.subscribe((state) => {
      const activeOrders = state.orders.filter((o) => o.status !== 'arrived').length;
      const cartItems = state.items.reduce((c, i) => c + i.quantity, 0);
      updateBadgeCount(activeOrders + cartItems);
    });

    return () => unsubscribe();
  }, [updateBadgeCount]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="restaurant/[id]"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="food/[restaurantId]/[itemId]"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="order-tracking/[id]"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="ai-assistant"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
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
});
