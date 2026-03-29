import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';

// Driver interface
interface Driver {
  id: number;
  user_id: number;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  phone: string;
  is_approved: boolean;
  approved_at: string | null;
  is_online: boolean;
  total_deliveries: number;
  rating: number;
  created_at: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.210.226.214:8000';

export default function DriversManagement() {
  const insets = useSafeAreaInsets();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'online'>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/drivers`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      const data = await response.json();
      setDrivers(data.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingDrivers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/drivers/pending`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      const data = await response.json();
      setPendingDrivers(data || []);
    } catch (err) {
      console.error('Failed to fetch pending drivers');
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchPendingDrivers();
  }, []);

  const handleApprove = async (driverId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/drivers/${driverId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Driver approved successfully');
        fetchDrivers();
        fetchPendingDrivers();
        setModalVisible(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to approve driver');
    }
  };

  const handleReject = async (driverId: number) => {
    Alert.prompt(
      'Reject Driver',
      'Enter reason for rejection:',
      async (reason) => {
        if (!reason) return;
        try {
          const response = await fetch(`${BASE_URL}/api/admin/drivers/${driverId}/reject`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${useAuthStore.getState().token}`,
            },
            body: JSON.stringify({ reason }),
          });
          
          if (response.ok) {
            Alert.alert('Success', 'Driver rejected');
            fetchDrivers();
            fetchPendingDrivers();
            setModalVisible(false);
          }
        } catch (err) {
          Alert.alert('Error', 'Failed to reject driver');
        }
      }
    );
  };

  const handleSuspend = async (driverId: number) => {
    Alert.alert(
      'Suspend Driver',
      'Are you sure you want to suspend this driver?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/api/admin/drivers/${driverId}/suspend`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${useAuthStore.getState().token}`,
                },
              });
              
              if (response.ok) {
                Alert.alert('Success', 'Driver suspended');
                fetchDrivers();
                setModalVisible(false);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to suspend driver');
            }
          },
        },
      ]
    );
  };

  const renderDriver = ({ item }: { item: Driver }) => (
    <TouchableOpacity
      style={styles.driverCard}
      onPress={() => {
        setSelectedDriver(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.driverHeader}>
        <View style={styles.driverIcon}>
          <Ionicons name="car" size={24} color={Colors.primary} />
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.user.name}</Text>
          <Text style={styles.driverEmail}>{item.user.email}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.is_approved ? styles.approvedBadge : styles.pendingBadge
        ]}>
          <Text style={[
            styles.statusText,
            item.is_approved ? styles.approvedText : styles.pendingText
          ]}>
            {item.is_approved ? 'Approved' : 'Pending'}
          </Text>
        </View>
      </View>
      
      <View style={styles.driverDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={14} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{item.vehicle_type} • {item.vehicle_number}</Text>
        </View>
        {item.is_approved && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.total_deliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.is_online ? 'Online' : 'Offline'}</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>★ {item.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const filteredDrivers = drivers.filter(driver => {
    if (activeTab === 'pending') return !driver.is_approved;
    if (activeTab === 'online') return driver.is_online;
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Drivers</Text>
          <Text style={styles.subtitle}>{drivers.length} total drivers</Text>
        </View>
        {pendingDrivers.length > 0 && (
          <View style={styles.pendingBadgeLarge}>
            <Text style={styles.pendingBadgeText}>{pendingDrivers.length} Pending</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'pending', 'online'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Drivers List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredDrivers}
          renderItem={renderDriver}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Driver Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDriver && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Driver Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={Colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedDriver.user.name}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{selectedDriver.user.email}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{selectedDriver.phone}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>License Number</Text>
                  <Text style={styles.detailValue}>{selectedDriver.license_number}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Vehicle</Text>
                  <Text style={styles.detailValue}>
                    {selectedDriver.vehicle_type} • {selectedDriver.vehicle_number}
                  </Text>
                </View>

                {selectedDriver.is_approved ? (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <View style={styles.statusRow}>
                        <View style={[
                          styles.statusIndicator,
                          selectedDriver.is_online ? styles.onlineIndicator : styles.offlineIndicator
                        ]} />
                        <Text style={styles.detailValue}>
                          {selectedDriver.is_online ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statsContainer}>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxValue}>{selectedDriver.total_deliveries}</Text>
                        <Text style={styles.statBoxLabel}>Deliveries</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxValue}>★ {selectedDriver.rating}</Text>
                        <Text style={styles.statBoxLabel}>Rating</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.suspendButton}
                      onPress={() => handleSuspend(selectedDriver.id)}
                    >
                      <Ionicons name="ban" size={20} color={Colors.danger} />
                      <Text style={styles.suspendButtonText}>Suspend Driver</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(selectedDriver.id)}
                    >
                      <Ionicons name="checkmark" size={20} color={Colors.white} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(selectedDriver.id)}
                    >
                      <Ionicons name="close" size={20} color={Colors.danger} />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Need to import this at the top
import { useAuthStore } from '@/store/authStore';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  pendingBadgeLarge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  pendingBadgeText: {
    color: '#F59E0B',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.lg,
  },
  driverCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  driverIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  driverEmail: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  approvedBadge: {
    backgroundColor: '#10B98120',
  },
  pendingBadge: {
    backgroundColor: '#F59E0B20',
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  approvedText: {
    color: '#10B981',
  },
  pendingText: {
    color: '#F59E0B',
  },
  driverDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  detailSection: {
    marginBottom: Spacing.lg,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  onlineIndicator: {
    backgroundColor: '#10B981',
  },
  offlineIndicator: {
    backgroundColor: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  statBoxLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  approveButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  rejectButtonText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  suspendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  suspendButtonText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
