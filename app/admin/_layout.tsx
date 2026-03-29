import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { Redirect } from 'expo-router';
import { Colors } from '@/constants/theme';
import { View, ActivityIndicator } from 'react-native';

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const token = useAuthStore((s) => s.token);

  // Wait for auth to load
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Not logged in - redirect to login
  if (!token) {
    return <Redirect href="/login" />;
  }

  // Only allow admin users
  if (user?.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.text.primary,
        },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.gray[200],
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.light,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
          headerTitle: 'Admin Dashboard',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
          headerTitle: 'Manage Categories',
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
          headerTitle: 'Manage Restaurants',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fast-food-outline" size={size} color={color} />
          ),
          headerTitle: 'Manage Products',
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          headerTitle: 'Manage Users',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
          headerTitle: 'Manage Orders',
        }}
      />
    </Tabs>
  );
}
