import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Dimensions,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useDataStore, Category, Restaurant } from '@/store/dataStore';
import { useFavoritesStore } from '@/store/favoritesStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POPULAR_CATEGORIES = ['Pizza', 'Sushi', 'Burgers', 'Healthy', 'Mexican', 'Indian'];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [localResults, setLocalResults] = useState<Restaurant[]>([]);

  // Real data from API
  const {
    categories,
    restaurants,
    searchResults,
    isLoadingRestaurants,
    isLoadingSearch,
    fetchCategories,
    fetchRestaurants,
    search,
  } = useDataStore();

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
    fetchRestaurants();
  }, []);

  // Handle category param from navigation (e.g., from Home screen)
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
      setSearchQuery('');
      // Filter restaurants by category
      fetchRestaurants({ category: params.category });
    }
  }, [params.category]);

  // Handle search query changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        search(searchQuery.trim());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-focus the search input on mount (only if no category pre-selected)
  useEffect(() => {
    if (!params.category) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [params.category]);

  const displayResults = useMemo(() => {
    if (searchQuery.trim() && searchResults) {
      return searchResults.restaurants;
    }
    if (selectedCategory) {
      return restaurants;
    }
    return [];
  }, [searchQuery, selectedCategory, searchResults, restaurants]);

  const isShowingResults = searchQuery.trim().length > 0 || selectedCategory !== null;
  const isLoading = isLoadingRestaurants || isLoadingSearch;

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
    inputRef.current?.focus();
  }, []);

  const handleCategoryChipPress = useCallback((categoryName: string) => {
    setSelectedCategory((prev) => {
      const newCategory = prev === categoryName ? null : categoryName;
      if (newCategory) {
        fetchRestaurants({ category: newCategory });
      }
      return newCategory;
    });
    setSearchQuery('');
  }, [fetchRestaurants]);

  const handlePopularCategoryPress = useCallback((categoryName: string) => {
    setSelectedCategory(categoryName);
    setSearchQuery('');
    fetchRestaurants({ category: categoryName });
    Keyboard.dismiss();
  }, [fetchRestaurants]);

  const handleRestaurantPress = useCallback(
    (restaurantId: string | number) => {
      Keyboard.dismiss();
      router.push(`/restaurant/${restaurantId}` as Href);
    },
    [router],
  );

  const handleFavoriteToggle = useCallback(
    (restaurantId: string | number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleFavorite({ type: 'restaurant', id: restaurantId.toString() });
    },
    [toggleFavorite],
  );

  const renderCategoryChip = useCallback(
    ({ item }: { item: Category }) => {
      const isSelected = selectedCategory === item.name;
      return (
        <TouchableOpacity
          style={[
            styles.categoryChip,
            isSelected && styles.categoryChipSelected,
          ]}
          onPress={() => handleCategoryChipPress(item.name)}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryChipEmoji}>{item.icon || '🍽️'}</Text>
          <Text
            style={[
              styles.categoryChipText,
              isSelected && styles.categoryChipTextSelected,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategory, handleCategoryChipPress],
  );

  const renderRestaurantCard = useCallback(
    ({ item }: { item: Restaurant }) => {
      const favorited = isFavorite('restaurant', item.id.toString());
      return (
        <TouchableOpacity
          style={styles.resultCard}
          onPress={() => handleRestaurantPress(item.id)}
          activeOpacity={0.9}
        >
          <View style={styles.resultImageContainer}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/600x400' }}
              style={styles.resultImage}
              resizeMode="cover"
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
          </View>
          <View style={styles.resultInfo}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={Colors.star} />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
            <View style={styles.cuisineTags}>
              {item.cuisine?.slice(0, 3).map((cuisine, index) => (
                <View key={index} style={styles.cuisineTag}>
                  <Text style={styles.cuisineTagText}>{cuisine}</Text>
                </View>
              ))}
            </View>
            <View style={styles.resultMeta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={Colors.text.secondary}
                />
                <Text style={styles.metaText}>{item.delivery_time}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={Colors.text.secondary}
                />
                <Text style={styles.metaText}>{item.distance || 'Nearby'}</Text>
              </View>
              <View style={styles.metaDot} />
              <Text style={styles.deliveryFee}>
                {item.delivery_fee === 0
                  ? 'Free delivery'
                  : `$${Number(item.delivery_fee).toFixed(2)} delivery`}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [isFavorite, handleRestaurantPress, handleFavoriteToggle],
  );

  const categoryKeyExtractor = useCallback(
    (item: Category) => `chip-${item.id}`,
    [],
  );
  const resultKeyExtractor = useCallback(
    (item: Restaurant) => `result-${item.id}`,
    [],
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="search-outline"
        size={64}
        color={Colors.gray[300]}
      />
      <Text style={styles.emptyTitle}>No restaurants found</Text>
      <Text style={styles.emptySubtitle}>
        Try searching with a different term or browse categories
      </Text>
      {(searchQuery.trim().length > 0 || selectedCategory) && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={handleClearAll}
          activeOpacity={0.7}
        >
          <Text style={styles.clearFilterText}>Clear filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.text.light}
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search restaurants, dishes..."
            placeholderTextColor={Colors.text.light}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.text.light}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      {!isShowingResults && (
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={categoryKeyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Search Results or Browse Section */}
      {isShowingResults ? (
        <>
          {/* Results Header */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {searchQuery.trim()
                ? `Results for "${searchQuery}"`
                : selectedCategory
                ? `${selectedCategory} Restaurants`
                : 'All Restaurants'}
            </Text>
            <Text style={styles.resultsCount}>
              {displayResults.length} found
            </Text>
          </View>

          {/* Results List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={displayResults}
              renderItem={renderRestaurantCard}
              keyExtractor={resultKeyExtractor}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
            />
          )}
        </>
      ) : (
        <ScrollView
          style={styles.browseContainer}
          contentContainerStyle={styles.browseContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Popular Categories */}
          <View style={styles.popularSection}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            <View style={styles.popularGrid}>
              {POPULAR_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.popularCard}
                  onPress={() => handlePopularCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.popularCardText}>{category}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* All Restaurants */}
          <View style={styles.allRestaurantsSection}>
            <Text style={styles.sectionTitle}>All Restaurants</Text>
            {isLoadingRestaurants ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              restaurants.slice(0, 10).map((restaurant) => (
                <TouchableOpacity
                  key={restaurant.id}
                  style={styles.allRestaurantCard}
                  onPress={() => handleRestaurantPress(restaurant.id)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: restaurant.image || 'https://via.placeholder.com/400x300' }}
                    style={styles.allRestaurantImage}
                    resizeMode="cover"
                  />
                  <View style={styles.allRestaurantInfo}>
                    <Text style={styles.allRestaurantName} numberOfLines={1}>
                      {restaurant.name}
                    </Text>
                    <Text style={styles.allRestaurantCuisine} numberOfLines={1}>
                      {restaurant.cuisine?.join(', ')}
                    </Text>
                    <View style={styles.allRestaurantMeta}>
                      <Ionicons name="star" size={12} color={Colors.star} />
                      <Text style={styles.allRestaurantRating}>{restaurant.rating}</Text>
                      <Text style={styles.allRestaurantTime}>• {restaurant.delivery_time}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Shadows.medium,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.sm,
  },
  categoriesSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    ...Shadows.small,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
  },
  categoryChipEmoji: {
    fontSize: 20,
  },
  categoryChipText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultsTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  resultsCount: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: Spacing.lg,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  resultImageContainer: {
    position: 'relative',
    height: 160,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    padding: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resultName: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cuisineTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  cuisineTag: {
    backgroundColor: Colors.primaryLight + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  cuisineTagText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.text.light,
    marginHorizontal: Spacing.sm,
  },
  deliveryFee: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  clearFilterButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  clearFilterText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  browseContainer: {
    flex: 1,
  },
  browseContent: {
    paddingBottom: Spacing.xxxl,
  },
  popularSection: {
    marginTop: Spacing.md,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  popularCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.small,
  },
  popularCardText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  allRestaurantsSection: {
    marginTop: Spacing.xxl,
  },
  allRestaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    ...Shadows.small,
  },
  allRestaurantImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
  },
  allRestaurantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  allRestaurantName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  allRestaurantCuisine: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  allRestaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allRestaurantRating: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 2,
  },
  allRestaurantTime: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
});
