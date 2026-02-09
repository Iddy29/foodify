import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';
import type { OrderItem } from '@/data/mockData';

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: OrderItem;
  onUpdateQuantity: (menuItemId: string, sizeName: string, quantity: number) => void;
  onRemove: (menuItemId: string, sizeName: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const triggerScalePulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  const handleIncrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerScalePulse();
    onUpdateQuantity(item.menuItem.id, item.selectedSize.name, item.quantity + 1);
  }, [item, onUpdateQuantity, triggerScalePulse]);

  const handleDecrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerScalePulse();
    if (item.quantity <= 1) {
      onRemove(item.menuItem.id, item.selectedSize.name);
    } else {
      onUpdateQuantity(item.menuItem.id, item.selectedSize.name, item.quantity - 1);
    }
  }, [item, onUpdateQuantity, onRemove, triggerScalePulse]);

  const handleRemove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove(item.menuItem.id, item.selectedSize.name);
  }, [item, onRemove]);

  const lineTotal = item.selectedSize.price * item.quantity;

  return (
    <Animated.View style={[styles.cartItemCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.cartItemRow}>
        <Image
          source={{ uri: item.menuItem.image }}
          style={styles.cartItemImage}
          defaultSource={require('@/assets/images/icon.png')}
        />
        <View style={styles.cartItemDetails}>
          <View style={styles.cartItemNameRow}>
            <Text style={styles.cartItemName} numberOfLines={1}>
              {item.menuItem.name}
            </Text>
            <TouchableOpacity
              onPress={handleRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              <Ionicons name="close-circle" size={22} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.cartItemSize}>{item.selectedSize.name}</Text>
          <Text style={styles.cartItemRestaurant} numberOfLines={1}>
            {item.restaurantName}
          </Text>

          {item.specialInstructions.length > 0 && (
            <Text style={styles.cartItemInstructions} numberOfLines={2}>
              &ldquo;{item.specialInstructions}&rdquo;
            </Text>
          )}

          <View style={styles.cartItemBottomRow}>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  item.quantity <= 1 && styles.quantityButtonDanger,
                ]}
                onPress={handleDecrement}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.quantity <= 1 ? 'trash-outline' : 'remove'}
                  size={16}
                  color={item.quantity <= 1 ? Colors.error : Colors.primary}
                />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncrement}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.cartItemPrice}>${lineTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDeliveryFee = useCartStore((s) => s.getDeliveryFee);
  const getTotal = useCartStore((s) => s.getTotal);

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();
  const isEmpty = items.length === 0;

  const handleUpdateQuantity = useCallback(
    (menuItemId: string, sizeName: string, quantity: number) => {
      updateQuantity(menuItemId, sizeName, quantity);
    },
    [updateQuantity],
  );

  const handleRemoveItem = useCallback(
    (menuItemId: string, sizeName: string) => {
      removeItem(menuItemId, sizeName);
    },
    [removeItem],
  );

  const handleClearCart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clearCart();
  }, [clearCart]);

  const handleCheckout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/checkout' as Href);
  }, [router]);

  const handleBrowseRestaurants = useCallback(() => {
    router.push('/(tabs)' as Href);
  }, [router]);

  if (isEmpty) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bag-outline" size={64} color={Colors.gray[300]} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven&apos;t added anything to your cart yet. Browse restaurants
            and discover something delicious!
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={handleBrowseRestaurants}
            activeOpacity={0.8}
          >
            <Ionicons name="restaurant-outline" size={18} color={Colors.white} />
            <Text style={styles.browseButtonText}>Browse restaurants</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <TouchableOpacity
          onPress={handleClearCart}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={styles.clearCartText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 200 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <CartItemCard
            key={`${item.menuItem.id}-${item.selectedSize.name}`}
            item={item}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
          />
        ))}

        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={handleBrowseRestaurants}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.addMoreButtonText}>Add More Items</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.costBreakdown}>
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

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  clearCartText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.error,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  // Cart Item Card
  cartItemCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  cartItemRow: {
    flexDirection: 'row',
  },
  cartItemImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cartItemNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  cartItemSize: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.primary,
    marginTop: 2,
  },
  cartItemRestaurant: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
    marginTop: 2,
  },
  cartItemInstructions: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  cartItemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },

  // Quantity Controls
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDanger: {
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  quantityText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    minWidth: 20,
    textAlign: 'center',
  },

  // Price
  cartItemPrice: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Add More Button
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addMoreButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Bottom Section
  bottomSection: {
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

  // Cost Breakdown
  costBreakdown: {
    marginBottom: Spacing.lg,
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
    color: Colors.text.primary,
  },

  // Checkout Button
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  checkoutButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
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
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  browseButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
