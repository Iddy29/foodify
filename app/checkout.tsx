import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';
import { useNotificationStore } from '@/store/notificationStore';
import SlideToAction from '@/components/SlideToAction';
import type { Order } from '@/data/mockData';

const STEPS = ['Address', 'Payment', 'Review'] as const;
const TOTAL_STEPS = STEPS.length;

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  icon: keyof typeof Ionicons.glyphMap;
  tag?: string;
}

const SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: 'home',
    label: 'Home',
    address: '123 Main Street, Apt 4B, New York, NY 10001',
    icon: 'home',
    tag: 'Default',
  },
  {
    id: 'work',
    label: 'Work',
    address: '456 Office Park, Suite 200, New York, NY 10018',
    icon: 'briefcase',
  },
  {
    id: 'other',
    label: "Mom's Place",
    address: '789 Oak Avenue, Brooklyn, NY 11201',
    icon: 'heart',
  },
];

interface PaymentOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  brandColor: string;
  type: 'card' | 'digital' | 'cash';
  cardInfo?: {
    lastFour: string;
    brand: string;
    expiry: string;
    gradient: readonly [string, string];
  };
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'credit_card',
    label: 'Credit Card',
    icon: 'card',
    description: 'Visa ending in 4242',
    brandColor: '#1A1F71',
    type: 'card',
    cardInfo: {
      lastFour: '4242',
      brand: 'VISA',
      expiry: '12/27',
      gradient: ['#1A1F71', '#2D34A4'] as const,
    },
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    icon: 'logo-apple',
    description: 'Pay with Face ID',
    brandColor: '#000000',
    type: 'digital',
  },
  {
    id: 'google_pay',
    label: 'Google Pay',
    icon: 'logo-google',
    description: 'Pay with Google',
    brandColor: '#4285F4',
    type: 'digital',
  },
  {
    id: 'cash',
    label: 'Cash on Delivery',
    icon: 'cash',
    description: 'Pay when order arrives',
    brandColor: Colors.success,
    type: 'cash',
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
  const sendOrderStatusNotification = useNotificationStore((s) => s.sendOrderStatusNotification);
  const updateBadgeCount = useNotificationStore((s) => s.updateBadgeCount);

  const [currentStep, setCurrentStep] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();
  const tip = 0;
  const serviceFee = subtotal > 0 ? 0.99 : 0;
  const grandTotal = total + tip + serviceFee;

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

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + 35 * 60 * 1000);

    const order: Order = {
      id: `order_${Date.now()}`,
      items: [...items],
      total: grandTotal,
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

    // Send notification and update badge
    await sendOrderStatusNotification(order, 'received');
    const activeCount = useCartStore.getState().orders.filter(
      (o) => o.status !== 'arrived'
    ).length;
    await updateBadgeCount(activeCount);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    router.replace(`/order-tracking/${order.id}` as Href);
  }, [
    canProceed,
    isPlacingOrder,
    items,
    grandTotal,
    deliveryFee,
    restaurantName,
    currentAddress,
    currentPaymentLabel,
    addOrder,
    clearCart,
    sendOrderStatusNotification,
    updateBadgeCount,
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

  // ─── Step 1: Address Selection ──────────────────────────────────────

  const renderAddressStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Where should we deliver?</Text>

      {/* Current Location Button */}
      <TouchableOpacity
        style={styles.currentLocationCard}
        onPress={handleUseCurrentLocation}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.locationGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.locationIconCircle}>
            <Ionicons name="navigate" size={20} color={Colors.primary} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Use Current Location</Text>
            <Text style={styles.locationSubtitle}>350 5th Ave, New York, NY 10118</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>

      <Text style={[styles.sectionSubTitle, { marginTop: Spacing.xxl }]}>
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
              <View style={styles.savedAddressLabelRow}>
                <Text
                  style={[
                    styles.savedAddressLabel,
                    isSelected && styles.savedAddressLabelSelected,
                  ]}
                >
                  {addr.label}
                </Text>
                {addr.tag && (
                  <View style={styles.addressTag}>
                    <Text style={styles.addressTagText}>{addr.tag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.savedAddressText} numberOfLines={1}>
                {addr.address}
              </Text>
            </View>
            <View
              style={[
                styles.radioOuter,
                isSelected && styles.radioOuterSelected,
              ]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.sectionSubTitle, { marginTop: Spacing.xxl }]}>
        Or enter a new address
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="location-outline"
          size={20}
          color={Colors.text.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Enter delivery address..."
          placeholderTextColor={Colors.text.light}
          value={deliveryAddress}
          onChangeText={(text) => {
            setDeliveryAddress(text);
            setSelectedSavedAddress(null);
          }}
          multiline={false}
          returnKeyType="done"
        />
        {deliveryAddress.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setDeliveryAddress('');
              setSelectedSavedAddress(null);
            }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.text.light} />
          </TouchableOpacity>
        )}
      </View>

      {/* Delivery Note */}
      <View style={[styles.inputContainer, { marginTop: Spacing.md }]}>
        <Ionicons
          name="chatbubble-outline"
          size={18}
          color={Colors.text.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Delivery note (e.g., ring the doorbell)"
          placeholderTextColor={Colors.text.light}
          value={deliveryNote}
          onChangeText={setDeliveryNote}
          multiline={false}
          returnKeyType="done"
        />
      </View>
    </View>
  );

  // ─── Step 2: Payment Method ─────────────────────────────────────────

  const renderCreditCardVisual = (option: PaymentOption) => {
    if (!option.cardInfo) return null;
    const { lastFour, brand, expiry, gradient } = option.cardInfo;
    const isSelected = selectedPayment === option.id;

    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => handleSelectPayment(option.id)}
        activeOpacity={0.8}
        style={{ marginBottom: Spacing.md }}
      >
        <LinearGradient
          colors={gradient}
          style={[
            styles.creditCardVisual,
            isSelected && styles.creditCardVisualSelected,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardBrand}>{brand}</Text>
            {isSelected && (
              <View style={styles.cardCheckmark}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              </View>
            )}
          </View>

          {/* Card chip */}
          <View style={styles.cardChip}>
            <View style={styles.cardChipLine} />
            <View style={[styles.cardChipLine, { marginTop: 2 }]} />
            <View style={[styles.cardChipLine, { marginTop: 2 }]} />
          </View>

          {/* Card number */}
          <View style={styles.cardNumberRow}>
            <Text style={styles.cardDots}>{'****'}</Text>
            <Text style={styles.cardDots}>{'****'}</Text>
            <Text style={styles.cardDots}>{'****'}</Text>
            <Text style={styles.cardLastFour}>{lastFour}</Text>
          </View>

          {/* Card footer */}
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardFooterLabel}>CARDHOLDER</Text>
              <Text style={styles.cardFooterValue}>JOHN DOE</Text>
            </View>
            <View>
              <Text style={styles.cardFooterLabel}>EXPIRES</Text>
              <Text style={styles.cardFooterValue}>{expiry}</Text>
            </View>
            <View style={styles.cardContactless}>
              <Ionicons name="wifi" size={18} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderDigitalPayOption = (option: PaymentOption) => {
    const isSelected = selectedPayment === option.id;
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.digitalPayCard,
          isSelected && styles.digitalPayCardSelected,
        ]}
        onPress={() => handleSelectPayment(option.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.digitalPayIcon, { backgroundColor: option.brandColor }]}>
          <Ionicons name={option.icon} size={22} color={Colors.white} />
        </View>
        <View style={styles.digitalPayInfo}>
          <Text
            style={[
              styles.digitalPayLabel,
              isSelected && styles.digitalPayLabelSelected,
            ]}
          >
            {option.label}
          </Text>
          <Text style={styles.digitalPayDesc}>{option.description}</Text>
        </View>
        <View
          style={[
            styles.radioOuter,
            isSelected && styles.radioOuterSelected,
          ]}
        >
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCashOption = (option: PaymentOption) => {
    const isSelected = selectedPayment === option.id;
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.cashCard,
          isSelected && styles.cashCardSelected,
        ]}
        onPress={() => handleSelectPayment(option.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.cashIconContainer, isSelected && { backgroundColor: Colors.success }]}>
          <Ionicons name="cash" size={24} color={isSelected ? Colors.white : Colors.success} />
        </View>
        <View style={styles.cashInfo}>
          <Text
            style={[
              styles.cashLabel,
              isSelected && styles.cashLabelSelected,
            ]}
          >
            {option.label}
          </Text>
          <Text style={styles.cashDesc}>{option.description}</Text>
        </View>
        <View
          style={[
            styles.radioOuter,
            isSelected && styles.radioOuterSelected,
          ]}
        >
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentStep = () => {
    const cardOptions = PAYMENT_OPTIONS.filter((o) => o.type === 'card');
    const digitalOptions = PAYMENT_OPTIONS.filter((o) => o.type === 'digital');
    const cashOptions = PAYMENT_OPTIONS.filter((o) => o.type === 'cash');

    return (
      <View style={styles.stepContent}>
        <Text style={styles.sectionTitle}>How would you like to pay?</Text>

        {/* Credit Cards */}
        <Text style={styles.sectionSubTitle}>Credit & Debit Cards</Text>
        {cardOptions.map(renderCreditCardVisual)}

        {/* Digital Wallets */}
        <Text style={[styles.sectionSubTitle, { marginTop: Spacing.lg }]}>
          Digital Wallets
        </Text>
        <View style={styles.digitalPayRow}>
          {digitalOptions.map(renderDigitalPayOption)}
        </View>

        {/* Cash */}
        <Text style={[styles.sectionSubTitle, { marginTop: Spacing.lg }]}>
          Other
        </Text>
        {cashOptions.map(renderCashOption)}
      </View>
    );
  };

  // ─── Step 3: Order Review ───────────────────────────────────────────

  const renderReviewStep = () => {
    const selectedPaymentOption = PAYMENT_OPTIONS.find((p) => p.id === selectedPayment);
    const selectedAddressObj = SAVED_ADDRESSES.find((a) => a.id === selectedSavedAddress);

    return (
      <View style={styles.stepContent}>
        <Text style={styles.sectionTitle}>Review Your Order</Text>

        {/* Restaurant & Items */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardHeader}>
            <View style={styles.reviewRestaurantIcon}>
              <Ionicons name="restaurant" size={16} color={Colors.white} />
            </View>
            <Text style={styles.reviewCardHeaderText}>{restaurantName}</Text>
            <Text style={styles.reviewItemCount}>
              {items.reduce((c, i) => c + i.quantity, 0)} items
            </Text>
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

        {/* Delivery & Payment Summary */}
        <View style={styles.reviewSummaryCard}>
          <TouchableOpacity
            style={styles.summaryRow}
            onPress={() => animateStepTransition(() => setCurrentStep(0))}
            activeOpacity={0.7}
          >
            <View style={styles.summaryIconBox}>
              <Ionicons name="location" size={18} color={Colors.primary} />
            </View>
            <View style={styles.summaryTextBox}>
              <Text style={styles.summaryLabel}>Delivery Address</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {selectedAddressObj?.label ? `${selectedAddressObj.label} - ` : ''}
                {currentAddress}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.light} />
          </TouchableOpacity>

          <View style={styles.summaryDivider} />

          <TouchableOpacity
            style={styles.summaryRow}
            onPress={() => animateStepTransition(() => setCurrentStep(1))}
            activeOpacity={0.7}
          >
            <View style={styles.summaryIconBox}>
              <Ionicons
                name={selectedPaymentOption?.icon ?? 'card'}
                size={18}
                color={Colors.primary}
              />
            </View>
            <View style={styles.summaryTextBox}>
              <Text style={styles.summaryLabel}>Payment Method</Text>
              <Text style={styles.summaryValue}>{currentPaymentLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.light} />
          </TouchableOpacity>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="time" size={18} color={Colors.primary} />
            </View>
            <View style={styles.summaryTextBox}>
              <Text style={styles.summaryLabel}>Estimated Delivery</Text>
              <Text style={styles.summaryValue}>25-35 minutes</Text>
            </View>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.costCard}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Subtotal</Text>
            <Text style={styles.costValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Delivery Fee</Text>
            <Text style={styles.costValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Service Fee</Text>
            <Text style={styles.costValue}>${serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.costDivider} />
          <View style={styles.costRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Slide to Pay */}
        <View style={{ marginTop: Spacing.xxl }}>
          <SlideToAction
            label={`Slide to Pay  -  $${grandTotal.toFixed(2)}`}
            sublabel="Place your order"
            onSlideComplete={handlePlaceOrder}
            isLoading={isPlacingOrder}
          />
        </View>
      </View>
    );
  };

  // ─── Render Step Content ──────────────────────────────────────────

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderAddressStep();
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
          { paddingBottom: insets.bottom + (isLastStep ? 40 : 120) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderCurrentStep()}
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation (not shown on Review step - uses Slide to Pay) */}
      {!isLastStep && (
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
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={!proceedEnabled}
          >
            <Text
              style={[
                styles.nextButtonText,
                !proceedEnabled && styles.nextButtonTextDisabled,
              ]}
            >
              Next
            </Text>
            <Ionicons name="arrow-forward" size={18} color={proceedEnabled ? Colors.white : Colors.text.light} />
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  sectionSubTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── Address Step ───────────────────────────────────────────────
  currentLocationCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  locationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  locationIconCircle: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  locationSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
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
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
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
    width: 44,
    height: 44,
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
  savedAddressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  savedAddressLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  savedAddressLabelSelected: {
    color: Colors.primary,
  },
  addressTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  addressTagText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  savedAddressText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  // ─── Radio Button ───────────────────────────────────────────────
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },

  // ─── Payment Step ───────────────────────────────────────────────
  creditCardVisual: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    minHeight: 190,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.large,
  },
  creditCardVisualSelected: {
    borderColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
  },
  cardCheckmark: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardChip: {
    width: 40,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.7)',
    padding: 4,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  cardChipLine: {
    height: 2,
    backgroundColor: 'rgba(200, 170, 0, 0.5)',
    borderRadius: 1,
  },
  cardNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cardDots: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
  },
  cardLastFour: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  cardFooterLabel: {
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardFooterValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  cardContactless: {
    opacity: 0.6,
  },

  // Digital Pay
  digitalPayRow: {
    gap: Spacing.md,
  },
  digitalPayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  digitalPayCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F3',
  },
  digitalPayIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitalPayInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  digitalPayLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  digitalPayLabelSelected: {
    color: Colors.primary,
  },
  digitalPayDesc: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  // Cash
  cashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  cashCardSelected: {
    borderColor: Colors.success,
    backgroundColor: '#ECFDF5',
  },
  cashIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cashLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  cashLabelSelected: {
    color: Colors.success,
  },
  cashDesc: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  // ─── Review Step ────────────────────────────────────────────────
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.small,
    marginBottom: Spacing.lg,
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
  reviewRestaurantIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCardHeaderText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  reviewItemCount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  reviewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  reviewItemImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
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

  // Summary Card
  reviewSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.small,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextBox: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text.light,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },

  // Cost Card
  costCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
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
