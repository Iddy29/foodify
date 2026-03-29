import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useDataStore, MenuItem, RestaurantWithMenu } from '@/store/dataStore';
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

  // Real data from API
  const {
    currentRestaurant,
    isLoadingRestaurant,
    fetchRestaurant,
  } = useDataStore();

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getTotal());

  // Fetch restaurant data
  useEffect(() => {
    if (id) {
      fetchRestaurant(id);
    }
  }, [id]);

  const restaurant = currentRestaurant;

  const isFavorited = useMemo(
    () => (restaurant ? isFavorite('restaurant', restaurant.id.toString()) : false),
    [restaurant, isFavorite],
  );

  const menuByCategory = useMemo(() => {
    if (!restaurant || !restaurant.menu_items) return {};
    const grouped: Record<string, MenuItem[]> = {};
    const categories = restaurant.menu_categories || [];
    
    for (const category of categories) {
      const items = restaurant.menu_items.filter((item) => item.category === category);
      if (items.length > 0) {
        grouped[category] = items;
      }
    }
    
    // Also group any items that don't match the predefined categories
    const otherItems = restaurant.menu_items.filter(
      (item) => !categories.includes(item.category)
    );
    if (otherItems.length > 0) {
      const uniqueCategories = [...new Set(otherItems.map((item) => item.category))];
      for (const category of uniqueCategories) {
        if (!grouped[category]) {
          grouped[category] = otherItems.filter((item) => item.category === category);
        }
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
    toggleFavorite({ type: 'restaurant', id: restaurant.id.toString() });
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

  // Loading state
  if (isLoadingRestaurant) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

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
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/400x300' }} 
            style={styles.menuItemImage} 
            resizeMode="cover" 
          />
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.menuItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.menuItemBottom}>
              <Text style={styles.menuItemPrice}>
                ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || '0').toFixed(2)}
              </Text>
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
            {Object.keys(menuByCategory).length > 0 ? (
              Object.entries(menuByCategory).map(([category, items]) =>
                renderMenuSection(category, items)
              )
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="fast-food-outline" size={48} color={Colors.gray[300]} />
                <Text style={styles.placeholderTitle}>No Menu Items</Text>
                <Text style={styles.placeholderText}>
                  This restaurant hasn't added any menu items yet.
                </Text>
              </View>
            )}
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
          <View style={styles.infoTabContainer}>
            <View style={styles.infoItemRow}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{restaurant.address}</Text>
              </View>
            </View>
            <View style={styles.infoItemRow}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Delivery Time</Text>
                <Text style={styles.infoValue}>{restaurant.delivery_time}</Text>
              </View>
            </View>
            <View style={styles.infoItemRow}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Delivery Fee</Text>
                <Text style={styles.infoValue}>
                  {restaurant.delivery_fee === 0 ? 'Free' : `$${Number(restaurant.delivery_fee).toFixed(2)}`}
                </Text>
              </View>
            </View>
            <View style={styles.infoItemRow}>
              <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Cuisine</Text>
                <Text style={styles.infoValue}>{restaurant.cuisine?.join(', ')}</Text>
              </View>
            </View>
            <View style={styles.infoItemRow}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Price Range</Text>
                <Text style={styles.infoValue}>{restaurant.price_range}</Text>
              </View>
            </View>
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
            source={{ uri: restaurant.cover_image || restaurant.image || 'https://via.placeholder.com/800x400' }}
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
              <Text style={styles.reviewCount}>({restaurant.review_count})</Text>
            </View>
            <View style={styles.infoDot} />
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.infoText}>{restaurant.distance || 'Nearby'}</Text>
            </View>
            <View style={styles.infoDot} />
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.infoText}>{restaurant.delivery_time}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{restaurant.description}</Text>

          {/* Cuisine Tags */}
          <View style={styles.cuisineContainer}>
            {restaurant.cuisine?.map((cuisine, index) => (
              <View key={index} style={styles.cuisineTag}>
                <Text style={styles.cuisineText}>{cuisine}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
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

      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + Spacing.md }]}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>

      {/* Favorite Button */}
      <TouchableOpacity
        style={[styles.favoriteButton, { top: insets.top + Spacing.md }]}
        onPress={handleFavoriteToggle}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFavorited ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorited ? Colors.primary : Colors.white}
        />
      </TouchableOpacity>

      {/* Cart Button (if items in cart) */}
      {cartItemCount > 0 && (
        <TouchableOpacity style={styles.cartButton} onPress={handleCartPress} activeOpacity={0.9}>
          <View style={styles.cartContent}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
            <View style={styles.cartTextContainer}>
              <Text style={styles.cartTotal}>${cartTotal.toFixed(2)}</Text>
              <Text style={styles.cartSubtext}>View Cart</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  coverContainer: {
    height: COVER_HEIGHT,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: COVER_HEIGHT,
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  restaurantName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    borderRadius: 2,
    backgroundColor: Colors.text.light,
    marginHorizontal: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cuisineTag: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  cuisineText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  menuContainer: {
    padding: Spacing.lg,
  },
  menuSection: {
    marginBottom: Spacing.xl,
  },
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  menuItemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  menuItemName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  menuItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuItemPrice: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  popularBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  popularBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  placeholderText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  infoTabContainer: {
    padding: Spacing.lg,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  infoTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  cartButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.large,
  },
  cartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  cartTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cartTotal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  cartSubtext: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
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
    ...Shadows.medium,
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
