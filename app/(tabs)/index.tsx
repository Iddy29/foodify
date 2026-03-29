import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useDataStore, Category, MenuItem } from '@/store/dataStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.78;
const FEATURED_SNAP_INTERVAL = FEATURED_CARD_WIDTH + Spacing.md;
const POPULAR_CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Real data from API
  const {
    categories,
    restaurant,
    menuItems,
    popularItems,
    isLoadingCategories,
    isLoadingMenuItems,
    fetchCategories,
    fetchRestaurant,
    fetchMenuItems,
    fetchPopularItems,
  } = useDataStore();

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const addItem = useCartStore((s) => s.addItem);
  const itemCount = useCartStore((s) => s.getItemCount());
  const user = useAuthStore((s) => s.user);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Fetch menu items when category changes
  useEffect(() => {
    fetchMenuItems(selectedCategory ? { category: selectedCategory } : {});
  }, [selectedCategory]);

  const loadData = async () => {
    await Promise.all([
      fetchCategories(),
      fetchRestaurant(),
      fetchMenuItems(),
      fetchPopularItems(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAvatarPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile' as Href);
  }, [router]);

  const featuredScrollX = useRef(new Animated.Value(0)).current;

  const handleFavoriteToggle = useCallback(
    (itemId: string | number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleFavorite({ type: 'menuItem', id: itemId.toString() });
    },
    [toggleFavorite],
  );

  const handleAddToCart = useCallback(
    (item: MenuItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addItem({
        menuItem: item,
        quantity: 1,
        selectedSize: item.sizes && item.sizes.length > 0 
          ? item.sizes[0] 
          : { name: 'Regular', price: item.price },
      });
    },
    [addItem],
  );

  const handleCategoryPress = useCallback(
    (category: Category) => {
      if (selectedCategory === category.name) {
        setSelectedCategory(null);
      } else {
        setSelectedCategory(category.name);
      }
    },
    [selectedCategory],
  );

  const handleSearchPress = useCallback(() => {
    router.push('/(tabs)/search' as Href);
  }, [router]);

  const handleAIAssistantPress = useCallback(() => {
    router.push('/ai-assistant' as Href);
  }, [router]);

  const onFeaturedScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / FEATURED_SNAP_INTERVAL);
    setActiveFeaturedIndex(index);
  }, []);

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => {
      const isSelected = selectedCategory === item.name;
      return (
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.categoryIconContainer,
            isSelected && styles.categoryIconContainerActive
          ]}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.categoryImage} />
            ) : (
              <Text style={styles.categoryEmoji}>{item.icon || '🍽️'}</Text>
            )}
          </View>
          <Text style={[
            styles.categoryName,
            isSelected && styles.categoryNameActive
          ]} numberOfLines={1}>
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [handleCategoryPress, selectedCategory],
  );

  const renderFeaturedCard = useCallback(
    ({ item }: { item: MenuItem }) => {
      const favorited = isFavorite('menuItem', item.id.toString());
      return (
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => router.push(`/menu-item/${item.id}` as Href)}
          activeOpacity={0.9}
        >
          <View style={styles.featuredImageContainer}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/800x400' }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={styles.featuredGradient}
            />
            <TouchableOpacity
              style={styles.heartButton}
              onPress={() => handleFavoriteToggle(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={20}
                color={favorited ? Colors.primary : Colors.white}
              />
            </TouchableOpacity>
            {/* Overlay Info */}
            <View style={styles.featuredOverlay}>
              <Text style={styles.featuredName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredCategory}>{item.category}</Text>
                <Text style={styles.featuredDot}>·</Text>
                <Text style={styles.featuredPrice}>
                  ${Number(item.price).toFixed(2)}
                </Text>
              </View>
            </View>
            {/* Add to Cart Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToCart(item)}
            >
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [isFavorite, handleFavoriteToggle, handleAddToCart, router],
  );

  const renderMenuItemCard = useCallback(
    ({ item }: { item: MenuItem }) => {
      const favorited = isFavorite('menuItem', item.id.toString());
      return (
        <TouchableOpacity
          style={styles.menuItemCard}
          onPress={() => router.push(`/menu-item/${item.id}` as Href)}
          activeOpacity={0.9}
        >
          <View style={styles.menuItemImageContainer}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/600x400' }}
              style={styles.menuItemImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.heartButtonSmall}
              onPress={() => handleFavoriteToggle(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={16}
                color={favorited ? Colors.primary : Colors.white}
              />
            </TouchableOpacity>
            {/* Category badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
          </View>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.menuItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.menuItemFooter}>
              <Text style={styles.menuItemPrice}>
                ${Number(item.price).toFixed(2)}
              </Text>
              <TouchableOpacity
                style={styles.smallAddButton}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [isFavorite, handleFavoriteToggle, handleAddToCart, router],
  );

  const categoryKeyExtractor = useCallback((item: Category) => `cat-${item.id}`, []);
  const itemKeyExtractor = useCallback((item: MenuItem) => `item-${item.id}`, []);

  const isLoading = isLoadingCategories || isLoadingMenuItems;

  if (isLoading && categories.length === 0) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#E8F5EE', '#F0FAF4', Colors.background]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.appTitle}>Foodify</Text>
              <Text style={styles.subtitle}>
                {user ? `Hi, ${user.name.split(' ')[0]}!` : 'What would you like to eat?'}
              </Text>
              {restaurant && (
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              activeOpacity={0.7}
            >
              {user ? (
                <Text style={styles.avatarInitial}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Ionicons name="person" size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={handleSearchPress}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color={Colors.text.light} />
            <Text style={styles.searchPlaceholder}>
              Search food & dishes...
            </Text>
            <View style={styles.searchDivider} />
            <TouchableOpacity
              style={styles.searchIconBtn}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <Ionicons name="mic-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {selectedCategory && (
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={styles.clearFilterText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={categoryKeyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* Popular Items */}
        {popularItems.length > 0 && !selectedCategory && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Items</Text>
            </View>
            <Animated.FlatList
              data={popularItems}
              renderItem={renderFeaturedCard}
              keyExtractor={itemKeyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              snapToInterval={FEATURED_SNAP_INTERVAL}
              decelerationRate="fast"
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: featuredScrollX } } }],
                { useNativeDriver: false, listener: onFeaturedScroll },
              )}
              scrollEventThrottle={16}
            />
            {/* Pagination Dots */}
            <View style={styles.paginationDots}>
              {popularItems.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.dot,
                    activeFeaturedIndex === index && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Menu Items Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? `${selectedCategory} Items` : 'All Menu Items'}
            </Text>
            <Text style={styles.itemCount}>{menuItems.length} items</Text>
          </View>
          {menuItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color={Colors.text.light} />
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          ) : (
            <View style={styles.menuGrid}>
              {menuItems.map((item) => (
                <View key={`menu-grid-${item.id}`} style={styles.menuGridItem}>
                  {renderMenuItemCard({ item })}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: Spacing.xxxl * 2 }} />
      </ScrollView>

      {/* Cart Badge Indicator */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.cartBadge, { bottom: Spacing.xl }]}
          onPress={() => router.push('/(tabs)/cart' as Href)}
          activeOpacity={0.85}
        >
          <Ionicons name="bag-handle" size={20} color={Colors.white} />
          <View style={styles.cartBadgeCount}>
            <Text style={styles.cartBadgeText}>
              {itemCount > 9 ? '9+' : itemCount}
            </Text>
          </View>
        </TouchableOpacity>
      )}
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
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  // Header Gradient
  headerGradient: {
    paddingBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  appTitle: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  restaurantName: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  avatarInitial: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.white,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  searchPlaceholder: {
    fontSize: FontSize.md,
    color: Colors.text.light,
    flex: 1,
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.gray[200],
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Categories
  categoryList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIconContainerActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  categoryImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  categoryNameActive: {
    color: Colors.primary,
  },

  // Sections
  sectionContainer: {
    marginTop: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  clearFilterText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  itemCount: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  // Featured Cards (Popular Items)
  featuredList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  featuredImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xl,
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  featuredOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    paddingRight: 70,
  },
  featuredName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featuredCategory: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  featuredPrice: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '700',
  },
  featuredDot: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },

  // Pagination Dots
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[300],
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },

  // Menu Items Grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  menuGridItem: {
    width: POPULAR_CARD_WIDTH,
  },
  menuItemCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  menuItemImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
  },
  heartButtonSmall: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  menuItemInfo: {
    padding: Spacing.md,
  },
  menuItemName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  smallAddButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text.light,
    marginTop: Spacing.md,
  },

  // Cart Badge
  cartBadge: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  cartBadgeCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
