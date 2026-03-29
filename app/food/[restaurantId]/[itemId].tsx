import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useDataStore, MenuItem, RestaurantWithMenu } from '@/store/dataStore';
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

  // Real data from API
  const {
    currentRestaurant,
    isLoadingRestaurant,
    fetchRestaurant,
  } = useDataStore();

  const addItem = useCartStore((s) => s.addItem);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);

  // Fetch restaurant data
  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant(restaurantId);
    }
  }, [restaurantId]);

  // Find the menu item from the restaurant data
  const menuItem = useMemo(() => {
    if (!currentRestaurant || !itemId) return undefined;
    return currentRestaurant.menu_items?.find(item => item.id.toString() === itemId);
  }, [currentRestaurant, itemId]);

  const restaurant = currentRestaurant;

  const isFavorited = useMemo(
    () => (menuItem ? isFavorite('dish', menuItem.id.toString()) : false),
    [menuItem, isFavorite],
  );

  const [selectedSize, setSelectedSize] = useState<PortionSize>('Medium');
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const selectedSizeData = useMemo(() => {
    if (!menuItem || !menuItem.sizes) return undefined;
    return menuItem.sizes.find((s) => s.name === selectedSize);
  }, [menuItem, selectedSize]);

  const totalPrice = useMemo(() => {
    if (!selectedSizeData) return 0;
    const price = typeof selectedSizeData.price === 'number' 
      ? selectedSizeData.price 
      : parseFloat(selectedSizeData.price || '0');
    return price * quantity;
  }, [selectedSizeData, quantity]);

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const handleFavoriteToggle = useCallback(() => {
    if (!menuItem || !restaurantId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite({ type: 'dish', id: menuItem.id.toString(), restaurantId });
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
      restaurantId: restaurant.id.toString(),
      restaurantName: restaurant.name,
    });

    router.back();
  }, [menuItem, selectedSizeData, restaurant, quantity, specialInstructions, addItem, router]);

  // Loading state
  if (isLoadingRestaurant) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

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

  // Default sizes if not provided
  const sizes = menuItem.sizes && menuItem.sizes.length > 0 
    ? menuItem.sizes 
    : [
        { name: 'Small', price: menuItem.price * 0.8 },
        { name: 'Medium', price: menuItem.price },
        { name: 'Large', price: menuItem.price * 1.2 },
      ];

  const ingredients = menuItem.ingredients || [];
  const basePrice = typeof menuItem.price === 'number' ? menuItem.price : parseFloat(menuItem.price || '0');

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
            source={{ uri: menuItem.image || 'https://via.placeholder.com/400x300' }}
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
            <Text style={styles.foodPrice}>${basePrice.toFixed(2)}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{menuItem.description}</Text>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <View style={styles.ingredientsList}>
                {ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientChip}>
                    <Text style={styles.ingredientChipText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Portion Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portion Size</Text>
            <View style={styles.sizeOptions}>
              {sizes.map((size) => {
                const isSelected = selectedSize === size.name;
                const sizePrice = typeof size.price === 'number' ? size.price : parseFloat(size.price || '0');
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
                      ${sizePrice.toFixed(2)}
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
                <Ionicons name="remove" size={20} color={Colors.text.primary} />
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
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.9}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Add to Cart</Text>
            <Text style={styles.buttonPrice}>${totalPrice.toFixed(2)}</Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  dismissButton: {
    position: 'absolute',
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  favoriteButton: {
    position: 'absolute',
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  content: {
    padding: Spacing.lg,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  foodName: {
    flex: 1,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginRight: Spacing.md,
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
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ingredientChip: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  ingredientChipText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  sizeOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sizeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.small,
  },
  sizeCardSelected: {
    borderColor: Colors.primary,
  },
  sizeName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  sizeNameSelected: {
    color: Colors.primary,
  },
  sizePrice: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sizePriceSelected: {
    color: Colors.primary,
  },
  instructionsInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addToCartButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  buttonPrice: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
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
    marginBottom: Spacing.xl,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  errorButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});
