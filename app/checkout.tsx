import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';
import type { Order } from '@/data/mockData';

const STEPS = ['Delivery', 'Payment', 'Review'] as const;
const TOTAL_STEPS = STEPS.length;

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: 'home',
    label: 'Home',
    address: '123 Main Street, Apt 4B, New York, NY 10001',
    icon: 'home-outline',
  },
  {
    id: 'work',
    label: 'Work',
    address: '456 Office Park, Suite 200, New York, NY 10018',
    icon: 'briefcase-outline',
  },
  {
    id: 'other',
    label: 'Mom\'s Place',
    address: '789 Oak Avenue, Brooklyn, NY 11201',
    icon: 'heart-outline',
  },
];

interface PaymentOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'credit_card',
    label: 'Credit Card',
    icon: 'card-outline',
    description: '**** **** **** 4242',
  },
  {
    id: 'cash',
    label: 'Cash on Delivery',
    icon: 'cash-outline',
    description: 'Pay when your order arrives',
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    icon: 'logo-apple',
    description: 'Pay with Apple Pay',
  },
  {
    id: 'google_pay',
    label: 'Google Pay',
    icon: 'logo-google',
    description: 'Pay with Google Pay',
  },
];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDeliveryFee = useCartStore((s) => s.getDeliveryFee);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const addOrder = useCartStore((s) => s.addOrder);

  const [currentStep, setCurrentStep] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const restaurantName = items.length > 0 ? items[0].restaurantName : 'Restaurant';

  const currentAddress = selectedSavedAddress
    ? SAVED_ADDRESSES.find((a) => a.id === selectedSavedAddress)?.address ?? deliveryAddress
    : deliveryAddress;

  const currentPaymentLabel = selectedPayment
    ? PAYMENT_OPTIONS.find((p) => p.id === selectedPayment)?.label ?? ''
    : '';

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return currentAddress.trim().length > 0;
      case 1:
        return selectedPayment !== null;
      case 2:
        return true;
      default:
        return false;
    }
  }, [currentStep, currentAddress, selectedPayment]);

  const animateStepTransition = useCallback(
    (callback: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        callback();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim],
  );

  const handleNext = useCallback(() => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < TOTAL_STEPS - 1) {
      animateStepTransition(() => setCurrentStep((s) => s + 1));
    }
  }, [currentStep, canProceed, animateStepTransition]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      animateStepTransition(() => setCurrentStep((s) => s - 1));
    } else {
      router.back();
    }
  }, [currentStep, router, animateStepTransition]);

  const handleSelectSavedAddress = useCallback((addressId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSavedAddress(addressId);
    const found = SAVED_ADDRESSES.find((a) => a.id === addressId);
    if (found) {
      setDeliveryAddress(found.address);
    }
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSavedAddress(null);
    setDeliveryAddress('350 5th Ave, New York, NY 10118');
  }, []);

  const handleSelectPayment = useCallback((paymentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPayment(paymentId);
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!canProceed() || isPlacingOrder) return;

    setIsPlacingOrder(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + 35 * 60 * 1000);

    const order: Order = {
      id: `order_${Date.now()}`,
      items: [...items],
      total,
      deliveryFee,
      status: 'received',
      restaurantName,
      createdAt: now.toISOString(),
      estimatedDelivery: estimatedDelivery.toISOString(),
      deliveryAddress: currentAddress,
      paymentMethod: currentPaymentLabel,
    };

    addOrder(order);
    clearCart();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    router.replace(`/order-tracking/${order.id}` as Href);
  }, [
    canProceed,
    isPlacingOrder,
    items,
    total,
    deliveryFee,
    restaurantName,
    currentAddress,
    currentPaymentLabel,
    addOrder,
    clearCart,
    router,
  ]);

  const handleHeaderBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // ─── Step Indicator ────────────────────────────────────────────────

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {STEPS.map((label, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <View key={label} style={styles.stepItemWrapper}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      (isActive || isCompleted) && styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isCompleted && styles.stepLabelCompleted,
                ]}
              >
                {label}
              </Text>
            </View>
            {index < TOTAL_STEPS - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  isCompleted && styles.stepConnectorCompleted,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );

  // ─── Step 1: Delivery ──────────────────────────────────────────────

  const renderDeliveryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Delivery Address</Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="location-outline"
          size={20}
          color={Colors.text.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Enter your delivery address"
          placeholderTextColor={Colors.text.light}
          value={deliveryAddress}
          onChangeText={(text) => {
            setDeliveryAddress(text);
            setSelectedSavedAddress(null);
          }}
          multiline={false}
          returnKeyType="done"
        />
      </View>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
        activeOpacity={0.7}
      >
        <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
        <Text style={styles.currentLocationText}>Use Current Location</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>
        Saved Addresses
      </Text>

      {SAVED_ADDRESSES.map((addr) => {
        const isSelected = selectedSavedAddress === addr.id;
        return (
          <TouchableOpacity
            key={addr.id}
            style={[
              styles.savedAddressCard,
              isSelected && styles.savedAddressCardSelected,
            ]}
            onPress={() => handleSelectSavedAddress(addr.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.savedAddressIconContainer,
                isSelected && styles.savedAddressIconContainerSelected,
              ]}
            >
              <Ionicons
                name={addr.icon}
                size={20}
                color={isSelected ? Colors.white : Colors.text.secondary}
              />
            </View>
            <View style={styles.savedAddressInfo}>
              <Text
                style={[
                  styles.savedAddressLabel,
                  isSelected && styles.savedAddressLabelSelected,
                ]}
              >
                {addr.label}
              </Text>
              <Text style={styles.savedAddressText} numberOfLines={1}>
                {addr.address}
              </Text>
            </View>
            {isSelected && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── Step 2: Payment ───────────────────────────────────────────────

  const renderPaymentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Payment Method</Text>

      {PAYMENT_OPTIONS.map((option) => {
        const isSelected = selectedPayment === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.paymentCard,
              isSelected && styles.paymentCardSelected,
            ]}
            onPress={() => handleSelectPayment(option.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.paymentIconContainer,
                isSelected && styles.paymentIconContainerSelected,
              ]}
            >
              <Ionicons
                name={option.icon}
                size={22}
                color={isSelected ? Colors.white : Colors.text.secondary}
              />
            </View>
            <View style={styles.paymentInfo}>
              <Text
                style={[
                  styles.paymentLabel,
                  isSelected && styles.paymentLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.paymentDescription}>{option.description}</Text>
            </View>
            <View
              style={[
                styles.paymentRadio,
                isSelected && styles.paymentRadioSelected,
              ]}
            >
              {isSelected && <View style={styles.paymentRadioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── Step 3: Review ────────────────────────────────────────────────

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Order Summary</Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewCardHeader}>
          <Ionicons name="restaurant-outline" size={18} color={Colors.primary} />
          <Text style={styles.reviewCardHeaderText}>{restaurantName}</Text>
        </View>

        {items.map((item) => {
          const lineTotal = item.selectedSize.price * item.quantity;
          return (
            <View
              key={`${item.menuItem.id}-${item.selectedSize.name}`}
              style={styles.reviewItemRow}
            >
              <Image
                source={{ uri: item.menuItem.image }}
                style={styles.reviewItemImage}
                defaultSource={require('@/assets/images/icon.png')}
              />
              <View style={styles.reviewItemInfo}>
                <Text style={styles.reviewItemName} numberOfLines={1}>
                  {item.menuItem.name}
                </Text>
                <Text style={styles.reviewItemMeta}>
                  {item.selectedSize.name} x {item.quantity}
                </Text>
              </View>
              <Text style={styles.reviewItemPrice}>${lineTotal.toFixed(2)}</Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>
        Delivery Details
      </Text>

      <View style={styles.reviewDetailCard}>
        <View style={styles.reviewDetailRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color={Colors.text.secondary}
          />
          <View style={styles.reviewDetailTextContainer}>
            <Text style={styles.reviewDetailLabel}>Delivery Address</Text>
            <Text style={styles.reviewDetailValue} numberOfLines={2}>
              {currentAddress}
            </Text>
          </View>
        </View>

        <View style={styles.reviewDetailDivider} />

        <View style={styles.reviewDetailRow}>
          <Ionicons
            name="card-outline"
            size={18}
            color={Colors.text.secondary}
          />
          <View style={styles.reviewDetailTextContainer}>
            <Text style={styles.reviewDetailLabel}>Payment Method</Text>
            <Text style={styles.reviewDetailValue}>{currentPaymentLabel}</Text>
          </View>
        </View>

        <View style={styles.reviewDetailDivider} />

        <View style={styles.reviewDetailRow}>
          <Ionicons
            name="time-outline"
            size={18}
            color={Colors.text.secondary}
          />
          <View style={styles.reviewDetailTextContainer}>
            <Text style={styles.reviewDetailLabel}>Estimated Delivery</Text>
            <Text style={styles.reviewDetailValue}>25-35 minutes</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>
        Cost Breakdown
      </Text>

      <View style={styles.reviewCostCard}>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Subtotal</Text>
          <Text style={styles.costValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Delivery Fee</Text>
          <Text style={styles.costValue}>${deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.costDivider} />
        <View style={styles.costRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  // ─── Render Step Content ──────────────────────────────────────────

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderDeliveryStep();
      case 1:
        return renderPaymentStep();
      case 2:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // ─── Empty Cart Guard ─────────────────────────────────────────────

  if (items.length === 0 && !isPlacingOrder) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bag-outline" size={64} color={Colors.gray[300]} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some items to your cart before checking out.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const proceedEnabled = canProceed();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={handleHeaderBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderCurrentStep()}
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.text.primary} />
          <Text style={styles.backButtonText}>
            {currentStep === 0 ? 'Cart' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !proceedEnabled && styles.nextButtonDisabled,
            isLastStep && proceedEnabled && styles.placeOrderButton,
          ]}
          onPress={isLastStep ? handlePlaceOrder : handleNext}
          activeOpacity={0.8}
          disabled={!proceedEnabled || isPlacingOrder}
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Text
                style={[
                  styles.nextButtonText,
                  !proceedEnabled && styles.nextButtonTextDisabled,
                ]}
              >
                {isLastStep ? 'Place Order' : 'Next'}
              </Text>
              {!isLastStep && (
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              )}
              {isLastStep && !isPlacingOrder && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Header ─────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 40,
  },

  // ─── Step Indicator ─────────────────────────────────────────────
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  stepItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    borderWidth: 2,
    borderColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepNumber: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text.light,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text.light,
  },
  stepLabelActive: {
    color: Colors.primary,
  },
  stepLabelCompleted: {
    color: Colors.success,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.gray[200],
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  stepConnectorCompleted: {
    backgroundColor: Colors.success,
  },

  // ─── Scroll ─────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  // ─── Step Content ───────────────────────────────────────────────
  stepContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },

  // ─── Delivery Step ──────────────────────────────────────────────
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    ...Shadows.small,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.lg,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  currentLocationText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  savedAddressCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F3',
  },
  savedAddressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedAddressIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  savedAddressInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  savedAddressLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  savedAddressLabelSelected: {
    color: Colors.primary,
  },
  savedAddressText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  // ─── Payment Step ───────────────────────────────────────────────
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  paymentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F3',
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  paymentLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  paymentLabelSelected: {
    color: Colors.primary,
  },
  paymentDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentRadioSelected: {
    borderColor: Colors.primary,
  },
  paymentRadioInner: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },

  // ─── Review Step ────────────────────────────────────────────────
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  reviewCardHeaderText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  reviewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  reviewItemImage: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray[100],
  },
  reviewItemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  reviewItemName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  reviewItemMeta: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  reviewItemPrice: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // ─── Review Details ─────────────────────────────────────────────
  reviewDetailCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  reviewDetailTextContainer: {
    flex: 1,
  },
  reviewDetailLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text.light,
    marginBottom: 2,
  },
  reviewDetailValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  reviewDetailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  // ─── Review Cost ────────────────────────────────────────────────
  reviewCostCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.small,
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
  costValue: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  costDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },

  // ─── Bottom Bar ─────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    gap: Spacing.md,
    ...Shadows.large,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
  },
  backButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    ...Shadows.medium,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.gray[200],
    ...Shadows.small,
  },
  placeOrderButton: {
    backgroundColor: Colors.success,
  },
  nextButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  nextButtonTextDisabled: {
    color: Colors.text.light,
  },

  // ─── Empty State ────────────────────────────────────────────────
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
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  emptyButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
