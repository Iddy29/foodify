import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';

export default function RootLayout() {
  const loadCart = useCartStore((s) => s.loadFromStorage);
  const loadFavorites = useFavoritesStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadCart();
    loadFavorites();
  }, [loadCart, loadFavorites]);

  return (
    <>
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
    </>
  );
}
