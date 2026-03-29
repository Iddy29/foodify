import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminStore, Order, OrderStats } from '@/store/adminStore';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  confirmed: { bg: '#DBEAFE', text: '#2563EB' },
  preparing: { bg: '#E0E7FF', text: '#4F46E5' },
  on_the_way: { bg: '#F3E8FF', text: '#9333EA' },
  delivered: { bg: '#D1FAE5', text: '#059669' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  on_the_way: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersManagement() {
  const insets = useSafeAreaInsets();
  const {
    orders,
    orderStats,
    isLoadingOrders,
    isLoading,
    error,
    fetchOrders,
    fetchOrderStats,
    updateOrderStatus,
    deleteOrder,
    clearError,
  } = useAdminStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, []);

  const handleRefresh = () => {
    fetchOrders();
    fetchOrderStats();
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      Alert.alert('Success', `Order status updated to ${STATUS_LABELS[newStatus]}`);
    } catch {
      // Error handled by store
    }
  };

  const handleDelete = (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete order "${order.order_number}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOrder(order.id);
            } catch {
              // Error handled by store
            }
          },
        },
      ]
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const renderStatCard = (title: string, value: number | string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => handleViewOrder(item)}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status]?.bg || Colors.gray[100] },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[item.status]?.text || Colors.text.secondary },
            ]}
          >
            {STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.infoText}>{item.user?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="restaurant-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.infoText}>{item.restaurant?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.infoText}>${Number(item.total).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.viewBtn]}
          onPress={() => handleViewOrder(item)}
        >
          <Ionicons name="eye-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoadingOrders && orders.length === 0) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>{orders.length} total orders</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      {orderStats && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          {renderStatCard('Today', orderStats.today_orders, '#10B981')}
          {renderStatCard('Pending', orderStats.pending_orders, '#F59E0B')}
          {renderStatCard('Preparing', orderStats.preparing_orders, '#6366F1')}
          {renderStatCard('Delivered', orderStats.delivered_orders, '#10B981')}
          {renderStatCard('Revenue', `$${Number(orderStats.today_revenue).toFixed(0)}`, '#EC4899')}
        </ScrollView>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.light} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.text.light}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.light} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === null && styles.filterChipActive]}
          onPress={() => setStatusFilter(null)}
        >
          <Text style={[styles.filterText, statusFilter === null && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, statusFilter === key && styles.filterChipActive]}
            onPress={() => setStatusFilter(key)}
          >
            <Text style={[styles.filterText, statusFilter === key && styles.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />

      {/* Order Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Order Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={Colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.detailOrderNumber}>{selectedOrder.order_number}</Text>

                  <View
                    style={[
                      styles.detailStatusBadge,
                      { backgroundColor: STATUS_COLORS[selectedOrder.status]?.bg || Colors.gray[100] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailStatusText,
                        { color: STATUS_COLORS[selectedOrder.status]?.text || Colors.text.secondary },
                      ]}
                    >
                      {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Customer</Text>
                    <Text style={styles.detailValue}>{selectedOrder.user?.name}</Text>
                    <Text style={styles.detailSubtext}>{selectedOrder.user?.email}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Restaurant</Text>
                    <Text style={styles.detailValue}>{selectedOrder.restaurant?.name}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Delivery Address</Text>
                    <Text style={styles.detailValue}>{selectedOrder.delivery_address}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Items</Text>
                    {selectedOrder.items?.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                        <Text style={styles.itemName}>{item.menuItem?.name}</Text>
                        <Text style={styles.itemPrice}>
                          ${(item.quantity * (item.selectedSize?.price || item.menuItem?.price || 0)).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.detailSection}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal</Text>
                      <Text style={styles.totalValue}>${Number(selectedOrder.subtotal).toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Delivery Fee</Text>
                      <Text style={styles.totalValue}>${Number(selectedOrder.delivery_fee).toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Tax</Text>
                      <Text style={styles.totalValue}>${Number(selectedOrder.tax).toFixed(2)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotal]}>
                      <Text style={styles.grandTotalLabel}>Total</Text>
                      <Text style={styles.grandTotalValue}>${Number(selectedOrder.total).toFixed(2)}</Text>
                    </View>
                  </View>

                  {/* Status Update Buttons */}
                  <View style={styles.statusButtonsContainer}>
                    <Text style={styles.detailLabel}>Update Status</Text>
                    <View style={styles.statusButtons}>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.statusButton,
                            selectedOrder.status === key && styles.statusButtonActive,
                          ]}
                          onPress={() => handleUpdateStatus(selectedOrder.id, key)}
                          disabled={isLoading}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              selectedOrder.status === key && styles.statusButtonTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minWidth: 100,
    ...Shadows.small,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statTitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.danger,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSize.sm,
  },
  listContent: {
    padding: Spacing.lg,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orderNumber: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  orderDate: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  orderInfo: {
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtn: {
    backgroundColor: Colors.primaryLight + '20',
  },
  deleteBtn: {
    backgroundColor: '#EF444420',
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  detailOrderNumber: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  detailStatusBadge: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  detailStatusText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  detailSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  detailSubtext: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  itemQuantity: {
    width: 30,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  itemPrice: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  totalValue: {
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  grandTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  grandTotalLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  grandTotalValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusButtonsContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statusButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusButtonActive: {
    backgroundColor: Colors.primary,
  },
  statusButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  statusButtonTextActive: {
    color: Colors.white,
  },
});
