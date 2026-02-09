import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';
import type { Order } from '@/data/mockData';

type OrderStatus = Order['status'];

interface StatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  received: {
    label: 'Received',
    color: '#EA580C',
    backgroundColor: '#FFF7ED',
    icon: 'checkmark-circle-outline',
  },
  preparing: {
    label: 'Preparing',
    color: '#CA8A04',
    backgroundColor: '#FEFCE8',
    icon: 'restaurant-outline',
  },
  on_the_way: {
    label: 'On the Way',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    icon: 'bicycle-outline',
  },
  arrived: {
    label: 'Arrived',
    color: Colors.success,
    backgroundColor: '#F0FDF4',
    icon: 'checkmark-done-circle-outline',
  },
};

function isActiveOrder(order: Order): boolean {
  return order.status !== 'arrived';
}

function formatOrderDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays < 7) {
      return date.toLocaleDateString([], {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function getItemCountLabel(order: Order): string {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return count === 1 ? '1 item' : `${count} items`;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.backgroundColor }]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.statusBadgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

function OrderCard({
  order,
  onTrack,
  onReorder,
}: {
  order: Order;
  onTrack: (orderId: string) => void;
  onReorder: (order: Order) => void;
}) {
  const active = isActiveOrder(order);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <View style={styles.orderCardHeaderLeft}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {order.restaurantName}
          </Text>
          <Text style={styles.orderDate}>
            {formatOrderDate(order.createdAt)}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.orderCardDivider} />

      <View style={styles.orderCardBody}>
        <View style={styles.orderSummaryRow}>
          <View style={styles.orderItemsInfo}>
            <Ionicons name="bag-outline" size={14} color={Colors.text.secondary} />
            <Text style={styles.orderItemsText}>{getItemCountLabel(order)}</Text>
          </View>
          <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
        </View>

        {order.items.length > 0 && (
          <Text style={styles.orderItemsList} numberOfLines={1}>
            {order.items.map((item) => item.menuItem.name).join(', ')}
          </Text>
        )}
      </View>

      <View style={styles.orderCardActions}>
        {active ? (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => onTrack(order.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={16} color={Colors.white} />
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => onReorder(order)}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const orders = useCartStore((s) => s.orders);
  const addItem = useCartStore((s) => s.addItem);

  const { activeOrders, pastOrders } = useMemo(() => {
    const active: Order[] = [];
    const past: Order[] = [];

    for (const order of orders) {
      if (isActiveOrder(order)) {
        active.push(order);
      } else {
        past.push(order);
      }
    }

    return { activeOrders: active, pastOrders: past };
  }, [orders]);

  const sections = useMemo(() => {
    const result: { title: string; data: Order[] }[] = [];

    if (activeOrders.length > 0) {
      result.push({ title: 'Active Orders', data: activeOrders });
    }
    if (pastOrders.length > 0) {
      result.push({ title: 'Past Orders', data: pastOrders });
    }

    return result;
  }, [activeOrders, pastOrders]);

  const handleTrackOrder = useCallback(
    (orderId: string) => {
      router.push(`/order-tracking/${orderId}` as Href);
    },
    [router],
  );

  const handleReorder = useCallback(
    (order: Order) => {
      for (const item of order.items) {
        addItem(item);
      }
      router.push('/(tabs)/cart' as Href);
    },
    [addItem, router],
  );

  const handleStartOrdering = useCallback(() => {
    router.push('/(tabs)' as Href);
  }, [router]);

  const renderOrderItem = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard
        order={item}
        onTrack={handleTrackOrder}
        onReorder={handleReorder}
      />
    ),
    [handleTrackOrder, handleReorder],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.title === 'Active Orders' && (
          <View style={styles.activeIndicator}>
            <View style={styles.activeIndicatorDot} />
            <Text style={styles.activeIndicatorText}>
              {activeOrders.length} active
            </Text>
          </View>
        )}
      </View>
    ),
    [activeOrders.length],
  );

  const keyExtractor = useCallback(
    (item: Order, index: number) => `order-${item.id}-${index}`,
    [],
  );

  const isEmpty = orders.length === 0;

  if (isEmpty) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>My Orders</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bag-outline" size={64} color={Colors.gray[300]} />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            When you place your first order, it will appear here. Start exploring
            restaurants and find something delicious!
          </Text>
          <TouchableOpacity
            style={styles.startOrderingButton}
            onPress={handleStartOrdering}
            activeOpacity={0.8}
          >
            <Text style={styles.startOrderingButtonText}>Start ordering</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <SectionList
        sections={sections}
        renderItem={renderOrderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  activeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
  },
  activeIndicatorText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  sectionSeparator: {
    height: Spacing.sm,
  },

  // Order Card
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.small,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  orderCardHeaderLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  restaurantName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  orderDate: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Divider
  orderCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  // Card Body
  orderCardBody: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  orderItemsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  orderItemsText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  orderItemsList: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
    marginTop: Spacing.xs,
  },

  // Card Actions
  orderCardActions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  trackButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  reorderButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  startOrderingButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  startOrderingButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
