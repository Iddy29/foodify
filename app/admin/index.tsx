import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminStore } from '@/store/adminStore';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}

function StatCard({ title, value, icon, color, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value.toLocaleString()}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { 
    dashboardStats, 
    isLoading, 
    error, 
    fetchDashboardStats 
  } = useAdminStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const onRefresh = () => {
    fetchDashboardStats();
  };

  if (isLoading && !dashboardStats) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }
      ]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Overview</Text>
        <Text style={styles.subtitle}>Manage your Foodify platform</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={Colors.white} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={dashboardStats?.total_users || 0}
          icon="people"
          color="#6366F1"
          onPress={() => router.push('/admin/users')}
        />
        <StatCard
          title="Restaurants"
          value={dashboardStats?.total_restaurants || 0}
          icon="restaurant"
          color="#10B981"
          onPress={() => router.push('/admin/restaurants')}
        />
        <StatCard
          title="Menu Items"
          value={dashboardStats?.total_menu_items || 0}
          icon="fast-food"
          color="#F59E0B"
          onPress={() => router.push('/admin/products')}
        />
        <StatCard
          title="Categories"
          value={dashboardStats?.total_categories || 0}
          icon="folder"
          color="#EC4899"
          onPress={() => router.push('/admin/categories')}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/categories')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EC489920' }]}>
              <Ionicons name="add-circle" size={28} color="#EC4899" />
            </View>
            <Text style={styles.actionText}>Add Category</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/restaurants')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="business" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionText}>Add Restaurant</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/products')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="pizza" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/users')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#6366F120' }]}>
              <Ionicons name="person-add" size={28} color="#6366F1" />
            </View>
            <Text style={styles.actionText}>Add User</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Users */}
      {dashboardStats?.recent_users && dashboardStats.recent_users.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity onPress={() => router.push('/admin/users')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboardStats.recent_users.map((user) => (
            <View key={user.id} style={styles.listItem}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{user.name}</Text>
                <Text style={styles.listSubtitle}>{user.email}</Text>
              </View>
              <View style={[styles.badge, user.role === 'admin' ? styles.adminBadge : styles.customerBadge]}>
                <Text style={[styles.badgeText, user.role === 'admin' ? styles.adminBadgeText : styles.customerBadgeText]}>
                  {user.role}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Restaurants */}
      {dashboardStats?.recent_restaurants && dashboardStats.recent_restaurants.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Restaurants</Text>
            <TouchableOpacity onPress={() => router.push('/admin/restaurants')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboardStats.recent_restaurants.map((restaurant) => (
            <View key={restaurant.id} style={styles.listItem}>
              <View style={styles.restaurantIcon}>
                <Ionicons name="restaurant" size={20} color={Colors.primary} />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{restaurant.name}</Text>
                <Text style={styles.listSubtitle}>Rating: {restaurant.rating} ★</Text>
              </View>
              <View style={[styles.statusBadge, restaurant.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusText, restaurant.is_active ? styles.activeText : styles.inactiveText]}>
                  {restaurant.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSize.sm,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.medium,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statTitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  seeAll: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  restaurantIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  listTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  listSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  adminBadge: {
    backgroundColor: '#6366F120',
  },
  customerBadge: {
    backgroundColor: '#10B98120',
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  adminBadgeText: {
    color: '#6366F1',
  },
  customerBadgeText: {
    color: '#10B981',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activeBadge: {
    backgroundColor: '#10B98120',
  },
  inactiveBadge: {
    backgroundColor: '#EF444420',
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  activeText: {
    color: '#10B981',
  },
  inactiveText: {
    color: '#EF4444',
  },
});
