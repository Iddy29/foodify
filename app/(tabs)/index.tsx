import React, { useCallback, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import {
  categories,
  getFeaturedRestaurants,
  getPopularRestaurants,
} from '@/data/mockData';
import type { Restaurant, Category } from '@/data/mockData';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useCartStore } from '@/store/cartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.78;
const FEATURED_SNAP_INTERVAL = FEATURED_CARD_WIDTH + Spacing.md;
const POPULAR_CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);

  const featuredRestaurants = useMemo(() => getFeaturedRestaurants(), []);
  const popularRestaurants = useMemo(() => getPopularRestaurants(), []);

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const itemCount = useCartStore((s) => s.getItemCount());

  // Animated value for featured scroll for pagination dots
  const featuredScrollX = useRef(new Animated.Value(0)).current;

  const handleFavoriteToggle = useCallback(
    (restaurantId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleFavorite({ type: 'restaurant', id: restaurantId });
    },
    [toggleFavorite],
  );

  const handleRestaurantPress = useCallback(
    (restaurantId: string) => {
      router.push(`/restaurant/${restaurantId}` as Href);
    },
    [router],
  );

  const handleCategoryPress = useCallback(
    (category: Category) => {
      router.push({
        pathname: '/(tabs)/search',
        params: { category: category.name },
      } as unknown as Href);
    },
    [router],
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
    ({ item }: { item: Category }) => (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryIconContainer}>
          <Text style={styles.categoryEmoji}>{item.icon}</Text>
        </View>
        <Text style={styles.categoryName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    ),
    [handleCategoryPress],
  );

  const renderFeaturedCard = useCallback(
    ({ item }: { item: Restaurant }) => {
      const favorited = isFavorite('restaurant', item.id);
      return (
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => handleRestaurantPress(item.id)}
          activeOpacity={0.9}
        >
          <View style={styles.featuredImageContainer}>
            <Image
              source={{ uri: item.coverImage }}
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
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={12} color={Colors.star} />
                  <Text style={styles.ratingPillText}>{item.rating}</Text>
                </View>
                <Text style={styles.featuredDelivery}>
                  {item.deliveryTime}
                </Text>
                <Text style={styles.featuredDot}>·</Text>
                <Text style={styles.featuredDelivery}>
                  {item.deliveryFee === 0
                    ? 'Free delivery'
                    : `$${item.deliveryFee.toFixed(2)} delivery`}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [isFavorite, handleRestaurantPress, handleFavoriteToggle],
  );

  const renderPopularCard = useCallback(
    ({ item }: { item: Restaurant }) => {
      const favorited = isFavorite('restaurant', item.id);
      return (
        <TouchableOpacity
          style={styles.popularCard}
          onPress={() => handleRestaurantPress(item.id)}
          activeOpacity={0.9}
        >
          <View style={styles.popularImageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.popularImage}
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
            {/* Delivery time badge */}
            <View style={styles.deliveryBadge}>
              <Ionicons name="time-outline" size={10} color={Colors.white} />
              <Text style={styles.deliveryBadgeText}>{item.deliveryTime}</Text>
            </View>
          </View>
          <View style={styles.popularInfo}>
            <Text style={styles.popularName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.popularMeta}>
              <Ionicons name="star" size={12} color={Colors.star} />
              <Text style={styles.popularRating}>{item.rating}</Text>
              <View style={styles.metaDotSmall} />
              <Text style={styles.popularDelivery}>{item.distance}</Text>
            </View>
            <Text style={styles.popularPrice}>
              {item.deliveryFee === 0
                ? 'Free delivery'
                : `$${item.deliveryFee.toFixed(2)} delivery`}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [isFavorite, handleRestaurantPress, handleFavoriteToggle],
  );

  const featuredKeyExtractor = useCallback((item: Restaurant) => `featured-${item.id}`, []);
  const categoryKeyExtractor = useCallback((item: Category) => `cat-${item.id}`, []);

  if (!featuredRestaurants.length && !popularRestaurants.length) {
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
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#E8F5EE', '#F0FAF4', Colors.background]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.appTitle}>Foodify</Text>
              <Text style={styles.subtitle}>What would you like to eat?</Text>
            </View>
            <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>
              <Ionicons name="person" size={20} color={Colors.white} />
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
              Search restaurants, dishes...
            </Text>
            <View style={styles.searchDivider} />
            <TouchableOpacity
              style={styles.searchIconBtn}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <Ionicons name="mic-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchIconBtn}
              onPress={handleAIAssistantPress}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={categoryKeyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* Featured Restaurants */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <Animated.FlatList
            data={featuredRestaurants}
            renderItem={renderFeaturedCard}
            keyExtractor={featuredKeyExtractor}
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
            {featuredRestaurants.map((_, index) => (
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

        {/* Popular Near You */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Near You</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.popularGrid}>
            {popularRestaurants.map((restaurant) => (
              <View key={`popular-grid-${restaurant.id}`} style={styles.popularGridItem}>
                {renderPopularCard({ item: restaurant })}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: Spacing.xxxl * 2 }} />
      </ScrollView>

      {/* Floating Action Button - AI Assistant */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Spacing.xl }]}
        onPress={handleAIAssistantPress}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color={Colors.white} />
        <View style={styles.fabLabel}>
          <Text style={styles.fabLabelText}>AI</Text>
        </View>
      </TouchableOpacity>

      {/* Cart Badge Indicator */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.cartBadge, { bottom: Spacing.xl + 70 }]}
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
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
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
  seeAllText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Featured Cards
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
    backdropFilter: 'blur(10px)',
  },
  featuredOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
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
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  ratingPillText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  featuredDelivery: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
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

  // Popular Grid
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  popularGridItem: {
    width: POPULAR_CARD_WIDTH,
  },
  popularCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  popularImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  popularImage: {
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
  deliveryBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  deliveryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  popularInfo: {
    padding: Spacing.md,
  },
  popularName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  popularMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  popularRating: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  metaDotSmall: {
    width: 3,
    height: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text.light,
  },
  popularDelivery: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  popularPrice: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  fabLabel: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  fabLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.text.primary,
  },

  // Cart Badge
  cartBadge: {
    position: 'absolute',
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
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
