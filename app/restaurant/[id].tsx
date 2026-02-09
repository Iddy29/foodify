import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { getRestaurantById } from '@/data/mockData';
import type { MenuItem } from '@/data/mockData';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useCartStore } from '@/store/cartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 250;
const TAB_OPTIONS = ['Menu', 'Reviews', 'Info'] as const;
type TabOption = (typeof TAB_OPTIONS)[number];

export default function RestaurantProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<TabOption>('Menu');

  const restaurant = useMemo(() => (id ? getRestaurantById(id) : undefined), [id]);

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getTotal());

  const isFavorited = useMemo(
    () => (restaurant ? isFavorite('restaurant', restaurant.id) : false),
    [restaurant, isFavorite],
  );

  const menuByCategory = useMemo(() => {
    if (!restaurant) return {};
    const grouped: Record<string, MenuItem[]> = {};
    for (const category of restaurant.menuCategories) {
      const items = restaurant.menu.filter((item) => item.category === category);
      if (items.length > 0) {
        grouped[category] = items;
      }
    }
    return grouped;
  }, [restaurant]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleFavoriteToggle = useCallback(() => {
    if (!restaurant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite({ type: 'restaurant', id: restaurant.id });
  }, [restaurant, toggleFavorite]);

  const handleMenuItemPress = useCallback(
    (item: MenuItem) => {
      if (!restaurant) return;
      router.push(`/food/${restaurant.id}/${item.id}` as Href);
    },
    [restaurant, router],
  );

  const handleCartPress = useCallback(() => {
    router.push('/(tabs)/cart' as Href);
  }, [router]);

  const handleTabPress = useCallback((tab: TabOption) => {
    if (tab !== 'Menu') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  }, []);

  // Parallax transform for cover image
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT],
    outputRange: [-COVER_HEIGHT / 2, 0, COVER_HEIGHT * 0.75],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-COVER_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });

  // Error state: restaurant not found
  if (!restaurant) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={[styles.errorBackButton, { top: insets.top + Spacing.md }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Ionicons name="restaurant-outline" size={64} color={Colors.gray[300]} />
        <Text style={styles.errorTitle}>Restaurant Not Found</Text>
        <Text style={styles.errorMessage}>
          The restaurant you are looking for does not exist or may have been removed.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMenuSection = (category: string, items: MenuItem[]) => (
    <View key={category} style={styles.menuSection}>
      <View style={styles.menuSectionHeader}>
        <Text style={styles.menuSectionTitle}>{category}</Text>
        <Text style={styles.menuSectionCount}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItemCard}
          onPress={() => handleMenuItemPress(item)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.image }} style={styles.menuItemImage} resizeMode="cover" />
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.menuItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.menuItemBottom}>
              <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
              {item.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleMenuItemPress(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Menu':
        return (
          <View style={styles.menuContainer}>
            {restaurant.menuCategories.map((category) => {
              const items = menuByCategory[category];
              if (!items || items.length === 0) return null;
              return renderMenuSection(category, items);
            })}
          </View>
        );
      case 'Reviews':
        return (
          <View style={styles.placeholderContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.placeholderTitle}>Reviews Coming Soon</Text>
            <Text style={styles.placeholderText}>
              Customer reviews will appear here. Check back soon!
            </Text>
          </View>
        );
      case 'Info':
        return (
          <View style={styles.placeholderContainer}>
            <Ionicons name="information-circle-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.placeholderTitle}>Restaurant Info</Text>
            <Text style={styles.placeholderText}>
              Hours, location details, and more will be available here soon.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: cartItemCount > 0 ? 100 : Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
      >
        {/* Cover Image with Parallax */}
        <View style={styles.coverContainer}>
          <Animated.Image
            source={{ uri: restaurant.coverImage }}
            style={[
              styles.coverImage,
              {
                transform: [{ translateY: imageTranslateY }, { scale: imageScale }],
              },
            ]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.coverGradient}
          />
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>

          {/* Rating, Distance, Delivery Row */}
          <View style={styles.infoRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={Colors.star} />
              <Text style={styles.ratingText}>{restaurant.rating}</Text>
              <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
            </View>
            <View style={styles.infoDot} />
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.infoText}>{restaurant.distance}</Text>
            </View>
            <View style={styles.infoDot} />
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.infoText}>{restaurant.deliveryTime}</Text>
            </View>
            <View style={styles.infoDot} />
            <View style={styles.infoItem}>
              <Ionicons name="bicycle-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.infoText}>
                {restaurant.deliveryFee === 0 ? 'Free' : `$${restaurant.deliveryFee.toFixed(2)}`}
              </Text>
            </View>
          </View>

          {/* Cuisine Tags */}
          <View style={styles.cuisineRow}>
            {restaurant.cuisine.map((tag) => (
              <View key={tag} style={styles.cuisineChip}>
                <Text style={styles.cuisineChipText}>{tag}</Text>
              </View>
            ))}
            <View style={styles.priceChip}>
              <Text style={styles.priceChipText}>{restaurant.priceRange}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{restaurant.description}</Text>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TAB_OPTIONS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </Animated.ScrollView>

      {/* Overlay Navigation Buttons */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + Spacing.sm }]}
        onPress={handleBack}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.favoriteButton, { top: insets.top + Spacing.sm }]}
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

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: insets.bottom + Spacing.lg }]}
          onPress={handleCartPress}
          activeOpacity={0.85}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{cartItemCount}</Text>
            </View>
            <Text style={styles.floatingCartText}>View Cart</Text>
          </View>
          <Text style={styles.floatingCartTotal}>${cartTotal.toFixed(2)}</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  // Cover Image
  coverContainer: {
    height: COVER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: COVER_HEIGHT * 0.5,
  },

  // Navigation Overlay Buttons
  backButton: {
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

  // Restaurant Info Section
  infoSection: {
    backgroundColor: Colors.white,
    marginTop: -Spacing.xl,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  restaurantName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  reviewCount: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  infoDot: {
    width: 4,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[300],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  cuisineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cuisineChip: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  cuisineChipText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  priceChip: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  priceChipText: {
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text.light,
  },
  activeTabText: {
    color: Colors.primary,
  },

  // Menu Section
  menuContainer: {
    paddingTop: Spacing.lg,
  },
  menuSection: {
    marginBottom: Spacing.xl,
  },
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  menuSectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  menuSectionCount: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
  },
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    ...Shadows.small,
  },
  menuItemImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  menuItemInfo: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  menuItemName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  menuItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuItemPrice: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  popularBadge: {
    backgroundColor: Colors.star,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  popularBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  // Placeholder Content
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
  },
  placeholderTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Floating Cart
  floatingCart: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    ...Shadows.large,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cartCountBadge: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.sm,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  cartCountText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  floatingCartText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  floatingCartTotal: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },

  // Error State
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  errorBackButton: {
    position: 'absolute',
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
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
