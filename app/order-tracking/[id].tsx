import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';
import type { Order } from '@/data/mockData';

type OrderStatus = Order['status'];

const STATUS_SEQUENCE: OrderStatus[] = ['received', 'preparing', 'on_the_way', 'arrived'];

interface TimelineStep {
  status: OrderStatus;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    status: 'received',
    label: 'Order Received',
    description: 'Your order has been confirmed',
    icon: 'time-outline',
    activeIcon: 'checkmark-circle',
  },
  {
    status: 'preparing',
    label: 'Preparing',
    description: 'The restaurant is making your food',
    icon: 'restaurant-outline',
    activeIcon: 'restaurant',
  },
  {
    status: 'on_the_way',
    label: 'Out for Delivery',
    description: 'Your order is on its way',
    icon: 'bicycle-outline',
    activeIcon: 'bicycle',
  },
  {
    status: 'arrived',
    label: 'Arrived',
    description: 'Your order has been delivered',
    icon: 'checkmark-done-outline',
    activeIcon: 'checkmark-done-circle',
  },
];

const AUTO_ADVANCE_INTERVAL = 8000;

function getStatusIndex(status: OrderStatus): number {
  return STATUS_SEQUENCE.indexOf(status);
}

function formatEstimatedDelivery(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Calculating...';
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return 'Any moment now';
    const diffMin = Math.ceil(diffMs / (1000 * 60));
    if (diffMin <= 1) return 'Less than a minute';
    if (diffMin < 60) return `${diffMin} min`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}h ${mins}m`;
  } catch {
    return 'Calculating...';
  }
}

// ─── Map Mockup Component ────────────────────────────────────────────────
function MapMockup({
  status,
  restaurantName,
}: {
  status: OrderStatus;
  restaurantName: string;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const routeProgress = useRef(new Animated.Value(0)).current;
  const bikePosition = useRef(new Animated.Value(0)).current;

  const statusIndex = getStatusIndex(status);
  const isOnTheWay = status === 'on_the_way';
  const isArrived = status === 'arrived';

  useEffect(() => {
    if (!isArrived) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isArrived, pulseAnim]);

  useEffect(() => {
    const targetProgress = statusIndex / (STATUS_SEQUENCE.length - 1);
    Animated.timing(routeProgress, {
      toValue: targetProgress,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [statusIndex, routeProgress]);

  useEffect(() => {
    // Move the bike along the route
    const bikeTarget = isArrived ? 1 : isOnTheWay ? 0.6 : statusIndex >= 1 ? 0.2 : 0;
    Animated.timing(bikePosition, {
      toValue: bikeTarget,
      duration: 1200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [statusIndex, isOnTheWay, isArrived, bikePosition]);

  const routeWidth = routeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const bikeLeft = bikePosition.interpolate({
    inputRange: [0, 1],
    outputRange: ['15%', '73%'],
  });

  return (
    <View style={mapStyles.container}>
      <LinearGradient
        colors={['#E0F0E5', '#D4E8D9', '#C8DFD0', '#D8EBE0']}
        style={mapStyles.mapBg}
      >
        {/* Grid Roads */}
        <View style={mapStyles.roadsLayer}>
          <View style={[mapStyles.hRoad, { top: '22%' }]} />
          <View style={[mapStyles.hRoad, mapStyles.mainRoad, { top: '48%' }]} />
          <View style={[mapStyles.hRoad, { top: '74%' }]} />
          <View style={[mapStyles.vRoad, { left: '18%' }]} />
          <View style={[mapStyles.vRoad, mapStyles.mainRoad, { left: '48%' }]} />
          <View style={[mapStyles.vRoad, { left: '78%' }]} />
        </View>

        {/* City Blocks */}
        <View style={[mapStyles.block, { top: '5%', left: '3%', width: 52, height: 38 }]} />
        <View style={[mapStyles.block, { top: '5%', left: '24%', width: 75, height: 32 }]} />
        <View style={[mapStyles.block, mapStyles.blockAlt, { top: '5%', left: '55%', width: 64, height: 36 }]} />
        <View style={[mapStyles.block, { top: '5%', left: '84%', width: 48, height: 34 }]} />

        <View style={[mapStyles.block, mapStyles.blockAlt, { top: '28%', left: '3%', width: 48, height: 44 }]} />
        <View style={[mapStyles.block, { top: '28%', left: '55%', width: 70, height: 38 }]} />
        <View style={[mapStyles.block, mapStyles.blockAlt, { top: '30%', left: '84%', width: 44, height: 36 }]} />

        <View style={[mapStyles.block, { top: '55%', left: '3%', width: 52, height: 40 }]} />
        <View style={[mapStyles.block, mapStyles.blockAlt, { top: '55%', left: '24%', width: 66, height: 34 }]} />
        <View style={[mapStyles.block, { top: '55%', left: '55%', width: 70, height: 40 }]} />
        <View style={[mapStyles.block, mapStyles.blockAlt, { top: '56%', left: '84%', width: 50, height: 34 }]} />

        <View style={[mapStyles.block, { top: '80%', left: '3%', width: 52, height: 36 }]} />
        <View style={[mapStyles.block, mapStyles.blockAlt, { top: '80%', left: '24%', width: 70, height: 32 }]} />
        <View style={[mapStyles.block, { top: '80%', left: '84%', width: 46, height: 34 }]} />

        {/* Park */}
        <View style={mapStyles.park}>
          <View style={[mapStyles.tree, { top: 4, left: 6 }]} />
          <View style={[mapStyles.tree, { top: 12, left: 22 }]} />
          <View style={[mapStyles.tree, { top: 4, left: 38 }]} />
          <View style={[mapStyles.tree, { top: 16, left: 10 }]} />
        </View>

        {/* Route Path (on main road) */}
        <View style={mapStyles.routeContainer}>
          <View style={mapStyles.routeBg} />
          <Animated.View style={[mapStyles.routeFill, { width: routeWidth }]} />
          {/* Route dots */}
          {[0.2, 0.4, 0.6, 0.8].map((pos, i) => (
            <View
              key={`dot-${i}`}
              style={[mapStyles.routeDot, { left: `${pos * 100}%` }]}
            />
          ))}
        </View>

        {/* Restaurant Marker (left side) */}
        <View style={mapStyles.restaurantMarker}>
          <View style={mapStyles.markerShadow} />
          <View style={mapStyles.markerPinRed}>
            <Ionicons name="restaurant" size={14} color={Colors.white} />
          </View>
          <View style={mapStyles.markerTailRed} />
          <View style={mapStyles.markerLabelBg}>
            <Text style={mapStyles.markerLabelText} numberOfLines={1}>
              {restaurantName}
            </Text>
          </View>
        </View>

        {/* Delivery Bike Marker (animated) */}
        {(isOnTheWay || isArrived) && (
          <Animated.View style={[mapStyles.bikeMarker, { left: bikeLeft }]}>
            <Animated.View
              style={[
                mapStyles.bikePulse,
                !isArrived && { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={mapStyles.bikePin}>
              <Ionicons name="bicycle" size={13} color={Colors.white} />
            </View>
          </Animated.View>
        )}

        {/* Destination Marker (right side) */}
        <View style={mapStyles.destMarker}>
          <Animated.View
            style={[
              mapStyles.destPulse,
              !isArrived && { transform: [{ scale: pulseAnim }], opacity: 0.3 },
              isArrived && { opacity: 0.5 },
            ]}
          />
          <View style={mapStyles.markerPinGreen}>
            <Ionicons name="home" size={14} color={Colors.white} />
          </View>
          <View style={mapStyles.markerTailGreen} />
          <View style={mapStyles.markerLabelBg}>
            <Text style={mapStyles.markerLabelText}>Your Location</Text>
          </View>
        </View>

        {/* Top-left ETA Badge */}
        <View style={mapStyles.etaBadge}>
          <Ionicons name="time-outline" size={13} color={Colors.primary} />
          <Text style={mapStyles.etaText}>
            {isArrived
              ? 'Delivered!'
              : isOnTheWay
                ? '8-12 min'
                : status === 'preparing'
                  ? '15-20 min'
                  : '25-35 min'}
          </Text>
        </View>

        {/* Zoom controls */}
        <View style={mapStyles.zoomCtrl}>
          <TouchableOpacity style={mapStyles.zoomBtn} activeOpacity={0.7}>
            <Ionicons name="add" size={16} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={mapStyles.zoomDiv} />
          <TouchableOpacity style={mapStyles.zoomBtn} activeOpacity={0.7}>
            <Ionicons name="remove" size={16} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const orders = useCartStore((s) => s.orders);
  const order = useMemo(() => orders.find((o: Order) => o.id === id) ?? null, [orders, id]);

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(
    order?.status ?? 'received',
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnims = useRef(
    STATUS_SEQUENCE.map(() => new Animated.Value(0)),
  ).current;

  const currentStatusIndex = getStatusIndex(currentStatus);
  const isArrived = currentStatus === 'arrived';

  // Sync if external changes
  useEffect(() => {
    if (order && getStatusIndex(order.status) > getStatusIndex(currentStatus)) {
      setCurrentStatus(order.status);
    }
  }, [order, currentStatus]);

  // Auto-advance simulation
  useEffect(() => {
    if (currentStatus === 'arrived') return;
    const timer = setTimeout(() => {
      const nextIndex = currentStatusIndex + 1;
      if (nextIndex < STATUS_SEQUENCE.length) {
        setCurrentStatus(STATUS_SEQUENCE[nextIndex]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, AUTO_ADVANCE_INTERVAL);
    return () => clearTimeout(timer);
  }, [currentStatus, currentStatusIndex]);

  // Pulse animation
  useEffect(() => {
    if (isArrived) {
      pulseAnim.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isArrived, pulseAnim]);

  // Progress lines
  useEffect(() => {
    progressAnims.forEach((anim, index) => {
      if (index < currentStatusIndex) {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      } else if (index === currentStatusIndex) {
        Animated.timing(anim, {
          toValue: 0.5,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      } else {
        anim.setValue(0);
      }
    });
  }, [currentStatusIndex, progressAnims]);

  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleGoHome = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)' as Href);
  }, [router]);

  const handleCallDriver = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleMessageDriver = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ─── Not Found State ──────────────────────────────────────────────
  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleGoBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFoundState}>
          <View style={styles.notFoundIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={Colors.gray[300]} />
          </View>
          <Text style={styles.notFoundTitle}>Order Not Found</Text>
          <Text style={styles.notFoundSubtitle}>
            We could not find an order with this ID.
          </Text>
          <TouchableOpacity style={styles.notFoundButton} onPress={handleGoHome} activeOpacity={0.8}>
            <Text style={styles.notFoundButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Derived Data ──────────────────────────────────────────────────
  const subtotal = order.total - order.deliveryFee;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const restaurantName = order.restaurantName;

  // ─── Timeline ──────────────────────────────────────────────────────
  const renderTimeline = () => (
    <View style={styles.timelineContainer}>
      {TIMELINE_STEPS.map((step, index) => {
        const stepIdx = getStatusIndex(step.status);
        const isCompleted = stepIdx < currentStatusIndex;
        const isCurrent = stepIdx === currentStatusIndex;
        const isFuture = stepIdx > currentStatusIndex;
        const isLastStep = index === TIMELINE_STEPS.length - 1;

        return (
          <View key={step.status} style={styles.timelineStep}>
            <View style={styles.timelineStepLeft}>
              {isCurrent ? (
                <Animated.View
                  style={[
                    styles.timelineCircle,
                    styles.timelineCircleCurrent,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Ionicons name={step.activeIcon} size={18} color={Colors.white} />
                </Animated.View>
              ) : (
                <View
                  style={[
                    styles.timelineCircle,
                    isCompleted && styles.timelineCircleCompleted,
                    isFuture && styles.timelineCircleFuture,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  ) : (
                    <Ionicons name={step.icon} size={16} color={Colors.gray[400]} />
                  )}
                </View>
              )}
              {!isLastStep && (
                <View style={styles.timelineLineContainer}>
                  <View style={styles.timelineLineBg} />
                  <Animated.View
                    style={[
                      styles.timelineLineFill,
                      {
                        height: progressAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              )}
            </View>
            <View style={styles.timelineStepContent}>
              <Text
                style={[
                  styles.timelineLabel,
                  isCompleted && styles.timelineLabelCompleted,
                  isCurrent && styles.timelineLabelCurrent,
                  isFuture && styles.timelineLabelFuture,
                ]}
              >
                {step.label}
              </Text>
              <Text
                style={[
                  styles.timelineDesc,
                  isCurrent && styles.timelineDescCurrent,
                  isFuture && styles.timelineDescFuture,
                ]}
              >
                {step.description}
              </Text>
              {isCurrent && !isArrived && (
                <View style={styles.currentBadge}>
                  <View style={styles.currentDot} />
                  <Text style={styles.currentBadgeText}>In Progress</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header overlaying map */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.headerButton} onPress={handleGoBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleGoHome} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (isArrived ? 120 : Spacing.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Section */}
        <MapMockup status={currentStatus} restaurantName={restaurantName} />

        {/* Status Card overlapping map */}
        <View style={styles.statusCard}>
          {/* ETA Header */}
          <View style={styles.etaHeader}>
            <View>
              <Text style={styles.etaLabel}>
                {isArrived ? 'Order Delivered!' : 'Estimated Delivery'}
              </Text>
              <Text style={styles.etaValue}>
                {isArrived
                  ? 'Enjoy your meal! 🎉'
                  : formatEstimatedDelivery(order.estimatedDelivery)}
              </Text>
            </View>
            {!isArrived && (
              <View style={styles.driverActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleCallDriver}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={17} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleMessageDriver}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble" size={17} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Timeline */}
          {renderTimeline()}
        </View>

        {/* Order Info */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Order Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="restaurant-outline" size={18} color={Colors.primary} />
            <View style={styles.detailTextBox}>
              <Text style={styles.detailLabel}>Restaurant</Text>
              <Text style={styles.detailValue}>{restaurantName}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <View style={styles.detailTextBox}>
              <Text style={styles.detailLabel}>Delivery Address</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {order.deliveryAddress}
              </Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Ionicons name="bag-outline" size={18} color={Colors.primary} />
            <View style={styles.detailTextBox}>
              <Text style={styles.detailLabel}>Items ({itemCount})</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {order.items.map((item) => `${item.quantity}x ${item.menuItem.name}`).join(', ')}
              </Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.costSection}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Subtotal</Text>
              <Text style={styles.costVal}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Delivery Fee</Text>
              <Text style={styles.costVal}>${order.deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costRow}>
              <Text style={styles.costTotalLabel}>Total</Text>
              <Text style={styles.costTotalValue}>${order.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {isArrived && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={20} color={Colors.white} />
            <Text style={styles.homeButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Map Styles ──────────────────────────────────────────────────────────

const mapStyles = StyleSheet.create({
  container: {
    height: 280,
    marginBottom: -BorderRadius.xxl,
    zIndex: 0,
  },
  mapBg: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  roadsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  hRoad: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  vRoad: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  mainRoad: {
    height: 5,
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  block: {
    position: 'absolute',
    backgroundColor: 'rgba(160, 195, 170, 0.45)',
    borderRadius: 3,
  },
  blockAlt: {
    backgroundColor: 'rgba(175, 210, 185, 0.4)',
  },
  park: {
    position: 'absolute',
    top: '28%',
    left: '24%',
    width: 56,
    height: 32,
    backgroundColor: 'rgba(120, 185, 135, 0.35)',
    borderRadius: 10,
  },
  tree: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(90, 160, 100, 0.55)',
  },
  routeContainer: {
    position: 'absolute',
    top: '48%',
    left: '15%',
    right: '15%',
    height: 5,
    marginTop: -2,
  },
  routeBg: {
    ...StyleSheet.absoluteFillObject,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  routeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  routeDot: {
    position: 'absolute',
    top: -1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginLeft: -3,
  },
  restaurantMarker: {
    position: 'absolute',
    top: '28%',
    left: '8%',
    alignItems: 'center',
  },
  markerShadow: {
    position: 'absolute',
    bottom: -8,
    width: 26,
    height: 8,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  markerPinRed: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.medium,
  },
  markerTailRed: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
    marginTop: -1,
  },
  markerLabelBg: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
    ...Shadows.small,
  },
  markerLabelText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.text.primary,
    maxWidth: 72,
    textAlign: 'center',
  },
  bikeMarker: {
    position: 'absolute',
    top: '38%',
    alignItems: 'center',
    zIndex: 10,
  },
  bikePulse: {
    position: 'absolute',
    top: -4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  bikePin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.medium,
  },
  destMarker: {
    position: 'absolute',
    top: '28%',
    right: '8%',
    alignItems: 'center',
  },
  destPulse: {
    position: 'absolute',
    top: -6,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  markerPinGreen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.medium,
  },
  markerTailGreen: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.success,
    marginTop: -1,
  },
  etaBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.medium,
  },
  etaText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  zoomCtrl: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDiv: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});

// ─── Main Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Scroll
  scrollView: {
    flex: 1,
    marginTop: 48,
  },
  scrollContent: {
    paddingTop: 0,
  },

  // Status Card
  statusCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    ...Shadows.large,
    zIndex: 1,
  },
  etaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  etaLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  etaValue: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  driverActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },

  // Timeline
  timelineContainer: {
    paddingTop: Spacing.lg,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 68,
  },
  timelineStepLeft: {
    width: 44,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[200],
    zIndex: 1,
  },
  timelineCircleCompleted: {
    backgroundColor: Colors.success,
  },
  timelineCircleCurrent: {
    backgroundColor: Colors.primary,
    ...Shadows.medium,
  },
  timelineCircleFuture: {
    backgroundColor: Colors.gray[100],
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  timelineLineContainer: {
    flex: 1,
    width: 3,
    marginVertical: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timelineLineBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
  },
  timelineLineFill: {
    width: '100%',
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  timelineStepContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingTop: 2,
    paddingBottom: Spacing.lg,
  },
  timelineLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  timelineLabelCompleted: {
    color: Colors.success,
  },
  timelineLabelCurrent: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
  timelineLabelFuture: {
    color: Colors.text.light,
  },
  timelineDesc: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  timelineDescCurrent: {
    color: Colors.text.secondary,
  },
  timelineDescFuture: {
    color: Colors.text.light,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  currentBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Details Card
  detailsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.medium,
  },
  detailsTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  detailTextBox: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text.light,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  // Cost
  costSection: {
    paddingTop: Spacing.md,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  costLabel: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  costVal: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  costDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  costTotalLabel: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  costTotalValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    ...Shadows.large,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  homeButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },

  // Not Found
  notFoundState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  notFoundIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  notFoundTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  notFoundSubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  notFoundButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  notFoundButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
