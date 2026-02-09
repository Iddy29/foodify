import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { getRestaurantById } from '@/data/mockData';
import type { Restaurant, MenuItem } from '@/data/mockData';
import { useFavoritesStore } from '@/store/favoritesStore';

type TabType = 'restaurants' | 'dishes';

interface FavoriteDish {
  menuItem: MenuItem;
  restaurant: Restaurant;
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('restaurants');

  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
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

  const handleBrowseRestaurants = useCallback(() => {
    router.push('/(tabs)/search' as Href);
  }, [router]);

  const renderRestaurantItem = useCallback(
    ({ item }: { item: Restaurant }) => (
      <TouchableOpacity
        style={styles.restaurantCard}
        onPress={() => handleRestaurantPress(item.id)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.restaurantImage}
          resizeMode="cover"
        />
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.restaurantMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={Colors.star} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
            <View style={styles.metaDot} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.cuisine.slice(0, 2).join(', ')}
            </Text>
          </View>
          <View style={styles.restaurantSubMeta}>
            <Ionicons name="time-outline" size={12} color={Colors.text.light} />
            <Text style={styles.subMetaText}>{item.deliveryTime}</Text>
            <View style={styles.metaDotSmall} />
            <Text style={styles.subMetaText}>{item.distance}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveRestaurant(item.id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handleRestaurantPress, handleRemoveRestaurant],
  );

  const renderDishItem = useCallback(
    ({ item }: { item: FavoriteDish }) => (
      <TouchableOpacity
        style={styles.dishCard}
        onPress={() => handleDishPress(item.restaurant.id, item.menuItem.id)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.menuItem.image }}
          style={styles.dishImage}
          resizeMode="cover"
        />
        <View style={styles.dishInfo}>
          <Text style={styles.dishName} numberOfLines={1}>
            {item.menuItem.name}
          </Text>
          <Text style={styles.dishRestaurant} numberOfLines={1}>
            {item.restaurant.name}
          </Text>
          <Text style={styles.dishPrice}>
            ${item.menuItem.price.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
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
          <Ionicons name="heart" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handleDishPress, handleRemoveDish],
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
        <Text style={styles.browseButtonText}>Browse restaurants</Text>
      </TouchableOpacity>
    </View>
  );

  const currentData =
    activeTab === 'restaurants' ? favoriteRestaurants : favoriteDishes;
  const isEmpty = currentData.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'restaurants' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('restaurants')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="restaurant-outline"
            size={16}
            color={
              activeTab === 'restaurants'
                ? Colors.white
                : Colors.text.secondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'restaurants' && styles.tabTextActive,
            ]}
          >
            Restaurants
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'dishes' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('dishes')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="fast-food-outline"
            size={16}
            color={
              activeTab === 'dishes'
                ? Colors.white
                : Colors.text.secondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'dishes' && styles.tabTextActive,
            ]}
          >
            Dishes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isEmpty ? (
        renderEmptyState()
      ) : activeTab === 'restaurants' ? (
        <FlatList
          data={favoriteRestaurants}
          renderItem={renderRestaurantItem}
          keyExtractor={restaurantKeyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={favoriteDishes}
          renderItem={renderDishItem}
          keyExtractor={dishKeyExtractor}
          contentContainerStyle={styles.listContent}
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

  // Tab Switcher
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    ...Shadows.small,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.white,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Restaurant Card
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  restaurantImage: {
    width: 100,
    height: 110,
  },
  restaurantInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text.light,
    marginHorizontal: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  restaurantSubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  subMetaText: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
  },
  metaDotSmall: {
    width: 2,
    height: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text.light,
  },

  // Dish Card
  dishCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  dishImage: {
    width: 100,
    height: 100,
  },
  dishInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  dishName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  dishRestaurant: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  dishPrice: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Remove Button
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
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
