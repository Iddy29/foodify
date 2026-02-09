import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { getRestaurantById } from '@/data/mockData';
import type { Restaurant, MenuItem } from '@/data/mockData';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useCartStore } from '@/store/cartStore';
import { useNotificationStore } from '@/store/notificationStore';

type TabType = 'restaurants' | 'dishes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP) / 2;

// Varied heights for Pinterest effect
const CARD_HEIGHTS = [200, 240, 220, 260, 210, 250];

interface FavoriteDish {
  menuItem: MenuItem;
  restaurant: Restaurant;
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('restaurants');
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useNotificationStore((s) => s.showToast);

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'restaurants' ? 0 : 1,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabIndicatorAnim]);

  const favoriteRestaurants = useMemo(() => {
    const ids = favorites
      .filter((f) => f.type === 'restaurant')
      .map((f) => f.id);
    return ids
      .map((id) => getRestaurantById(id))
      .filter((r): r is Restaurant => r !== undefined);
  }, [favorites]);

  const favoriteDishes = useMemo(() => {
    const dishFavorites = favorites.filter((f) => f.type === 'dish');
    const result: FavoriteDish[] = [];

    for (const fav of dishFavorites) {
      const restaurant = fav.restaurantId
        ? getRestaurantById(fav.restaurantId)
        : undefined;

      if (!restaurant) continue;

      const menuItem = restaurant.menu.find((m) => m.id === fav.id);
      if (!menuItem) continue;

      result.push({ menuItem, restaurant });
    }

    return result;
  }, [favorites]);

  const handleRemoveRestaurant = useCallback(
    (restaurantId: string, restaurantName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Remove Favorite',
        `Remove ${restaurantName} from your favorites?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toggleFavorite({ type: 'restaurant', id: restaurantId });
            },
          },
        ],
      );
    },
    [toggleFavorite],
  );

  const handleRemoveDish = useCallback(
    (dishId: string, restaurantId: string, dishName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Remove Favorite',
        `Remove ${dishName} from your favorites?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toggleFavorite({ type: 'dish', id: dishId, restaurantId });
            },
          },
        ],
      );
    },
    [toggleFavorite],
  );

  const handleRestaurantPress = useCallback(
    (restaurantId: string) => {
      router.push(`/restaurant/${restaurantId}` as Href);
    },
    [router],
  );

  const handleDishPress = useCallback(
    (restaurantId: string, itemId: string) => {
      router.push(`/food/${restaurantId}/${itemId}` as Href);
    },
    [router],
  );

  const handleQuickReorder = useCallback(
    (dish: FavoriteDish) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const defaultSize = dish.menuItem.sizes[1] ?? dish.menuItem.sizes[0];
      addItem({
        menuItem: dish.menuItem,
        quantity: 1,
        selectedSize: defaultSize,
        specialInstructions: '',
        restaurantId: dish.restaurant.id,
        restaurantName: dish.restaurant.name,
      });
      showToast({
        title: 'Added to Cart!',
        message: `${dish.menuItem.name} from ${dish.restaurant.name}`,
        type: 'success',
        duration: 3000,
      });
    },
    [addItem, showToast],
  );

  const handleBrowseRestaurants = useCallback(() => {
    router.push('/(tabs)/search' as Href);
  }, [router]);

  // ─── Pinterest-style Restaurant Grid ──────────────────────────────

  const renderRestaurantCard = useCallback(
    ({ item, index }: { item: Restaurant; index: number }) => {
      const height = CARD_HEIGHTS[index % CARD_HEIGHTS.length];

      return (
        <TouchableOpacity
          style={[styles.pinterestCard, { height }]}
          onPress={() => handleRestaurantPress(item.id)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.coverImage || item.image }}
            style={styles.pinterestImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.pinterestGradient}
          >
            <View style={styles.pinterestContent}>
              <Text style={styles.pinterestName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.pinterestMeta}>
                <View style={styles.pinterestRating}>
                  <Ionicons name="star" size={12} color={Colors.star} />
                  <Text style={styles.pinterestRatingText}>{item.rating}</Text>
                </View>
                <Text style={styles.pinterestDelivery}>{item.deliveryTime}</Text>
              </View>
              <Text style={styles.pinterestCuisine} numberOfLines={1}>
                {item.cuisine.slice(0, 2).join(' · ')}
              </Text>
            </View>
          </LinearGradient>

          {/* Favorite Heart */}
          <TouchableOpacity
            style={styles.pinterestHeart}
            onPress={() => handleRemoveRestaurant(item.id, item.name)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [handleRestaurantPress, handleRemoveRestaurant],
  );

  // ─── Pinterest-style Dish Grid ────────────────────────────────────

  const renderDishCard = useCallback(
    ({ item, index }: { item: FavoriteDish; index: number }) => {
      const height = CARD_HEIGHTS[(index + 2) % CARD_HEIGHTS.length];

      return (
        <TouchableOpacity
          style={[styles.pinterestCard, { height }]}
          onPress={() => handleDishPress(item.restaurant.id, item.menuItem.id)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.menuItem.image }}
            style={styles.pinterestImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.pinterestGradient}
          >
            <View style={styles.pinterestContent}>
              <Text style={styles.pinterestName} numberOfLines={1}>
                {item.menuItem.name}
              </Text>
              <Text style={styles.pinterestRestaurantName} numberOfLines={1}>
                {item.restaurant.name}
              </Text>
              <View style={styles.pinterestDishBottom}>
                <Text style={styles.pinterestPrice}>
                  ${item.menuItem.price.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.quickReorderBtn}
                  onPress={() => handleQuickReorder(item)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons name="add" size={16} color={Colors.white} />
                  <Text style={styles.quickReorderText}>Re-order</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Favorite Heart */}
          <TouchableOpacity
            style={styles.pinterestHeart}
            onPress={() =>
              handleRemoveDish(
                item.menuItem.id,
                item.restaurant.id,
                item.menuItem.name,
              )
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [handleDishPress, handleRemoveDish, handleQuickReorder],
  );

  const restaurantKeyExtractor = useCallback(
    (item: Restaurant) => `fav-rest-${item.id}`,
    [],
  );

  const dishKeyExtractor = useCallback(
    (item: FavoriteDish) => `fav-dish-${item.restaurant.id}-${item.menuItem.id}`,
    [],
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={64} color={Colors.gray[300]} />
      </View>
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'restaurants'
          ? 'Start exploring restaurants and tap the heart icon to save your favorites here.'
          : 'Browse restaurant menus and tap the heart icon on dishes you love.'}
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={handleBrowseRestaurants}
        activeOpacity={0.8}
      >
        <Ionicons name="compass-outline" size={18} color={Colors.white} />
        <Text style={styles.browseButtonText}>Explore Restaurants</Text>
      </TouchableOpacity>
    </View>
  );

  const totalFavorites = favoriteRestaurants.length + favoriteDishes.length;
  const currentData =
    activeTab === 'restaurants' ? favoriteRestaurants : favoriteDishes;
  const isEmpty = currentData.length === 0;

  const tabTranslateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.xs * 2) / 2],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>
            {totalFavorites} saved item{totalFavorites !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <Animated.View
          style={[
            styles.tabIndicator,
            { transform: [{ translateX: tabTranslateX }] },
          ]}
        />
        <TouchableOpacity
          style={styles.tab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('restaurants');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'restaurants' ? 'restaurant' : 'restaurant-outline'}
            size={16}
            color={activeTab === 'restaurants' ? Colors.white : Colors.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'restaurants' && styles.tabTextActive,
            ]}
          >
            Restaurants
          </Text>
          {favoriteRestaurants.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'restaurants' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'restaurants' && styles.tabBadgeTextActive]}>
                {favoriteRestaurants.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('dishes');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'dishes' ? 'fast-food' : 'fast-food-outline'}
            size={16}
            color={activeTab === 'dishes' ? Colors.white : Colors.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'dishes' && styles.tabTextActive,
            ]}
          >
            Dishes
          </Text>
          {favoriteDishes.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'dishes' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'dishes' && styles.tabBadgeTextActive]}>
                {favoriteDishes.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isEmpty ? (
        renderEmptyState()
      ) : activeTab === 'restaurants' ? (
        <FlatList
          data={favoriteRestaurants}
          renderItem={renderRestaurantCard}
          keyExtractor={restaurantKeyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={favoriteDishes}
          renderItem={renderDishCard}
          keyExtractor={dishKeyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  subtitle: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginTop: 2,
  },

  // Tab Switcher
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    width: '50%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    zIndex: 1,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },

  // Pinterest Grid
  gridContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },

  // Pinterest Card
  pinterestCard: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.gray[100],
    ...Shadows.medium,
  },
  pinterestImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  pinterestGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pinterestContent: {
    padding: Spacing.md,
  },
  pinterestName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  pinterestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  pinterestRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pinterestRatingText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  pinterestDelivery: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  pinterestCuisine: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  pinterestRestaurantName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
  },
  pinterestDishBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinterestPrice: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.white,
  },
  pinterestHeart: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },

  // Quick Re-order Button
  quickReorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  quickReorderText: {
    fontSize: FontSize.xs,
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
