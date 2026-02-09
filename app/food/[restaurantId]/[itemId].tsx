import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { getRestaurantById, getMenuItemById } from '@/data/mockData';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

type PortionSize = 'Small' | 'Medium' | 'Large';

export default function FoodDetailScreen() {
  const { restaurantId, itemId } = useLocalSearchParams<{
    restaurantId: string;
    itemId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const restaurant = useMemo(
    () => (restaurantId ? getRestaurantById(restaurantId) : undefined),
    [restaurantId],
  );

  const menuItem = useMemo(
    () => (restaurantId && itemId ? getMenuItemById(restaurantId, itemId) : undefined),
    [restaurantId, itemId],
  );

  const addItem = useCartStore((s) => s.addItem);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);

  const isFavorited = useMemo(
    () => (menuItem ? isFavorite('dish', menuItem.id) : false),
    [menuItem, isFavorite],
  );

  const [selectedSize, setSelectedSize] = useState<PortionSize>('Medium');
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const selectedSizeData = useMemo(() => {
    if (!menuItem) return undefined;
    return menuItem.sizes.find((s) => s.name === selectedSize);
  }, [menuItem, selectedSize]);

  const totalPrice = useMemo(() => {
    if (!selectedSizeData) return 0;
    return selectedSizeData.price * quantity;
  }, [selectedSizeData, quantity]);

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const handleFavoriteToggle = useCallback(() => {
    if (!menuItem || !restaurantId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite({ type: 'dish', id: menuItem.id, restaurantId });
  }, [menuItem, restaurantId, toggleFavorite]);

  const handleSizeSelect = useCallback((size: PortionSize) => {
    setSelectedSize(size);
  }, []);

  const handleDecreaseQuantity = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1));
  }, []);

  const handleIncreaseQuantity = useCallback(() => {
    setQuantity((prev) => prev + 1);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!menuItem || !selectedSizeData || !restaurant) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addItem({
      menuItem,
      quantity,
      selectedSize: selectedSizeData,
      specialInstructions,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    });

    router.back();
  }, [menuItem, selectedSizeData, restaurant, quantity, specialInstructions, addItem, router]);

  // Not found state
  if (!menuItem || !restaurant) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={[styles.dismissButton, { top: insets.top + Spacing.md }]}
          onPress={handleDismiss}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Ionicons name="fast-food-outline" size={64} color={Colors.gray[300]} />
        <Text style={styles.errorTitle}>Item Not Found</Text>
        <Text style={styles.errorMessage}>
          The item you are looking for does not exist or may have been removed.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleDismiss} activeOpacity={0.7}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Food Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: menuItem.image }}
            style={styles.foodImage}
            resizeMode="cover"
          />

          {/* Dismiss Button */}
          <TouchableOpacity
            style={[styles.dismissButton, { top: insets.top + Spacing.md }]}
            onPress={handleDismiss}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.favoriteButton, { top: insets.top + Spacing.md }]}
            onPress={handleFavoriteToggle}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorited ? Colors.primary : Colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Name and Price */}
          <View style={styles.headerSection}>
            <Text style={styles.foodName}>{menuItem.name}</Text>
            <Text style={styles.foodPrice}>${menuItem.price.toFixed(2)}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{menuItem.description}</Text>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {menuItem.ingredients.map((ingredient) => (
                <View key={ingredient} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Portion Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portion Size</Text>
            <View style={styles.sizeOptions}>
              {menuItem.sizes.map((size) => {
                const isSelected = selectedSize === size.name;
                return (
                  <TouchableOpacity
                    key={size.name}
                    style={[styles.sizeCard, isSelected && styles.sizeCardSelected]}
                    onPress={() => handleSizeSelect(size.name as PortionSize)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.sizeName, isSelected && styles.sizeNameSelected]}
                    >
                      {size.name}
                    </Text>
                    <Text
                      style={[styles.sizePrice, isSelected && styles.sizePriceSelected]}
                    >
                      ${size.price.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <TextInput
              style={styles.instructionsInput}
              placeholder="Type your instruction here..."
              placeholderTextColor={Colors.text.light}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={handleDecreaseQuantity}
                activeOpacity={0.7}
                disabled={quantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={quantity <= 1 ? Colors.gray[300] : Colors.text.primary}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncreaseQuantity}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={22} color={Colors.white} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
          <Text style={styles.addToCartPrice}>${totalPrice.toFixed(2)}</Text>
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
  scrollView: {
    flex: 1,
  },

  // Image
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  foodImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  dismissButton: {
    position: 'absolute',
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  favoriteButton: {
    position: 'absolute',
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },

  // Content
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  foodName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.md,
    letterSpacing: -0.5,
  },
  foodPrice: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },

  // Sections
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  // Ingredients
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ingredientChip: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  ingredientChipText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  },

  // Size Selector
  sizeOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sizeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  sizeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  sizeName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sizeNameSelected: {
    color: Colors.white,
  },
  sizePrice: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  sizePriceSelected: {
    color: Colors.white,
  },

  // Special Instructions
  instructionsInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    minHeight: 80,
    lineHeight: 22,
  },

  // Quantity Selector
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xl,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  quantityButtonDisabled: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[200],
  },
  quantityText: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text.primary,
    minWidth: 32,
    textAlign: 'center',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    ...Shadows.large,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  addToCartText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  addToCartPrice: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    marginRight: Spacing.lg,
  },

  // Error State
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  errorTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  errorButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
