import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useTrackingStore, TrackingInfo } from '@/store/trackingStore';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: 'receipt' },
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle' },
  { key: 'preparing', label: 'Preparing', icon: 'restaurant' },
  { key: 'out_for_delivery', label: 'On the Way', icon: 'bicycle' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done' },
];

export default function TrackingScreen() {
  const { trackingKey } = useLocalSearchParams<{ trackingKey: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/track/${trackingKey}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setTrackingInfo(data);
      } else {
        setError(data.message || 'Tracking not found');
      }
    } catch (err) {
      setError('Failed to fetch tracking info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [trackingKey]);

  const getCurrentStep = () => {
    if (!trackingInfo) return -1;
    const index = STATUS_STEPS.findIndex(s => s.key === trackingInfo.status);
    return index >= 0 ? index : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#3B82F6';
      case 'preparing': return '#8B5CF6';
      case 'out_for_delivery': return '#EC4899';
      case 'delivered': return '#10B981';
      default: return Colors.text.light;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !trackingInfo) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.danger} />
          <Text style={styles.errorTitle}>Tracking Not Found</Text>
          <Text style={styles.errorText}>{error || 'Invalid tracking key'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTracking}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentStep = getCurrentStep();
  const statusColor = getStatusColor(trackingInfo.status);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>{trackingInfo.order_number}</Text>
              <Text style={styles.orderDate}>
                {new Date(trackingInfo.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {trackingInfo.status.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            {STATUS_STEPS.map((step, index) => {
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[
                      styles.stepIcon,
                      isActive && styles.stepIconActive,
                      isCurrent && { backgroundColor: statusColor }
                    ]}>
                      <Ionicons
                        name={step.icon as any}
                        size={16}
                        color={isActive ? Colors.white : Colors.text.light}
                      />
                    </View>
                    {index < STATUS_STEPS.length - 1 && (
                      <View style={[
                        styles.stepLine,
                        index < currentStep && styles.stepLineActive
                      ]} />
                    )}
                  </View>
                  <View style={styles.stepRight}>
                    <Text style={[
                      styles.stepLabel,
                      isActive && styles.stepLabelActive
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.stepCurrent}>Current Status</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Driver Info */}
        {trackingInfo.driver && trackingInfo.is_trackable && (
          <View style={styles.driverCard}>
            <Text style={styles.sectionTitle}>Your Delivery Partner</Text>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={32} color={Colors.white} />
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{trackingInfo.driver.name}</Text>
                <Text style={styles.driverPhone}>{trackingInfo.driver.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Live Location */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.locationTitle}>Live Location</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.locationCoords}>
                Lat: {trackingInfo.driver.latitude?.toFixed(6)}, 
                Lng: {trackingInfo.driver.longitude?.toFixed(6)}
              </Text>
              <Text style={styles.locationUpdated}>
                Updated: {new Date(trackingInfo.driver.location_updated_at).toLocaleTimeString()}
              </Text>
            </View>

            {trackingInfo.estimated_arrival && (
              <View style={styles.etaCard}>
                <Ionicons name="time" size={20} color={Colors.primary} />
                <Text style={styles.etaText}>
                  Estimated Arrival: {new Date(trackingInfo.estimated_arrival).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.addressCard}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color={Colors.text.secondary} />
            <Text style={styles.addressText}>{trackingInfo.delivery_address}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  orderNumber: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  orderDate: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  stepsContainer: {
    paddingTop: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepLeft: {
    alignItems: 'center',
    width: 40,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconActive: {
    backgroundColor: Colors.primary,
  },
  stepLine: {
    width: 2,
    height: 40,
    backgroundColor: Colors.gray[200],
    marginVertical: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepRight: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingBottom: Spacing.md,
  },
  stepLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  stepLabelActive: {
    color: Colors.text.primary,
  },
  stepCurrent: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  driverCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  driverName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  driverPhone: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCard: {
    backgroundColor: Colors.gray[100],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  locationTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#EF4444',
  },
  locationCoords: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  locationUpdated: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
    marginTop: 4,
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  etaText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  addressCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
});
