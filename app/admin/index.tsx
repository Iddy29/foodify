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
  value: number | string;
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
        <Text style={styles.statValue}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
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
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Manage your restaurant</Text>
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
          title="Total Orders"
          value={dashboardStats?.total_orders ?? 0}
          icon="receipt-outline"
          color={Colors.primary}
          onPress={() => router.push('/admin/orders')}
        />
        <StatCard
          title="Today's Orders"
          value={dashboardStats?.today_orders ?? 0}
          icon="today-outline"
          color="#10B981"
        />
        <StatCard
          title="Pending Orders"
          value={dashboardStats?.pending_orders ?? 0}
          icon="time-outline"
          color="#F59E0B"
          onPress={() => router.push('/admin/orders')}
        />
        <StatCard
          title="Menu Items"
          value={dashboardStats?.total_menu_items ?? 0}
          icon="fast-food-outline"
          color="#8B5CF6"
          onPress={() => router.push('/admin/products')}
        />
      </View>

      {/* Revenue Section */}
      <View style={styles.revenueSection}>
        <Text style={styles.sectionTitle}>Revenue</Text>
        <View style={styles.revenueGrid}>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>
              ${parseFloat(String(dashboardStats?.total_revenue ?? 0)).toFixed(2)}
            </Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Today's Revenue</Text>
            <Text style={styles.revenueValue}>
              ${parseFloat(String(dashboardStats?.today_revenue ?? 0)).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/products')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="add-circle" size={24} color="#D97706" />
            </View>
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/categories')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="pricetags" size={24} color="#2563EB" />
            </View>
            <Text style={styles.actionText}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/restaurants')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="restaurant" size={24} color="#9333EA" />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/orders')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="list" size={24} color="#059669" />
            </View>
            <Text style={styles.actionText}>View Orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/admin/orders')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {dashboardStats?.recent_orders?.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.text.light} />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        ) : (
          dashboardStats?.recent_orders?.slice(0, 5).map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push('/admin/orders')}
            >
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
                <Text style={styles.orderCustomer}>{order.user?.name || 'Unknown'}</Text>
              </View>
              <View style={styles.orderMeta}>
                <Text style={styles.orderAmount}>
                  ${parseFloat(String(order.total)).toFixed(2)}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: 
                    order.status === 'pending' ? '#FEF3C7' :
                    order.status === 'confirmed' ? '#DBEAFE' :
                    order.status === 'preparing' ? '#E0E7FF' :
                    order.status === 'on_the_way' ? '#F3E8FF' :
                    order.status === 'delivered' ? '#D1FAE5' : '#FEE2E2'
                  }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: 
                      order.status === 'pending' ? '#D97706' :
                      order.status === 'confirmed' ? '#2563EB' :
                      order.status === 'preparing' ? '#4F46E5' :
                      order.status === 'on_the_way' ? '#9333EA' :
                      order.status === 'delivered' ? '#059669' : '#DC2626'
                    }
                  ]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
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
    textDecorationLine: 'underline',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.small,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
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
  revenueSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  revenueLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  revenueValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.small,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text.light,
    marginTop: Spacing.md,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  orderCustomer: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
