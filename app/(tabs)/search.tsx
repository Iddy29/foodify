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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import {
  searchRestaurants,
  categories,
  getRestaurantsByCategory,
} from '@/data/mockData';
import type { Restaurant, Category } from '@/data/mockData';
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

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);

  // Handle category param from navigation (e.g., from Home screen)
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
      setSearchQuery('');
    }
  }, [params.category]);

  // Auto-focus the search input on mount (only if no category pre-selected)
  useEffect(() => {
    if (!params.category) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [params.category]);

  const searchResults = useMemo(() => {
    if (selectedCategory) {
      const categoryResults = getRestaurantsByCategory(selectedCategory);
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return categoryResults.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.cuisine.some((c) => c.toLowerCase().includes(query)) ||
            r.menu.some((m) => m.name.toLowerCase().includes(query))
        );
      }
      return categoryResults;
    }
    if (searchQuery.trim()) {
      return searchRestaurants(searchQuery.trim());
    }
    return [];
  }, [searchQuery, selectedCategory]);

  const isShowingResults = searchQuery.trim().length > 0 || selectedCategory !== null;

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
    setSelectedCategory((prev) => (prev === categoryName ? null : categoryName));
  }, []);

  const handlePopularCategoryPress = useCallback((categoryName: string) => {
    setSelectedCategory(categoryName);
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const handleRestaurantPress = useCallback(
    (restaurantId: string) => {
      Keyboard.dismiss();
      router.push(`/restaurant/${restaurantId}` as Href);
    },
    [router],
  );

  const handleFavoriteToggle = useCallback(
    (restaurantId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleFavorite({ type: 'restaurant', id: restaurantId });
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
          <Text style={styles.categoryChipEmoji}>{item.icon}</Text>
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
      const favorited = isFavorite('restaurant', item.id);
      return (
        <TouchableOpacity
          style={styles.resultCard}
          onPress={() => handleRestaurantPress(item.id)}
          activeOpacity={0.9}
        >
          <View style={styles.resultImageContainer}>
            <Image
              source={{ uri: item.image }}
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
              {item.cuisine.slice(0, 3).map((cuisine) => (
                <View key={cuisine} style={styles.cuisineTag}>
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
                <Text style={styles.metaText}>{item.deliveryTime}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={Colors.text.secondary}
                />
                <Text style={styles.metaText}>{item.distance}</Text>
              </View>
              <View style={styles.metaDot} />
              <Text style={styles.deliveryFee}>
                {item.deliveryFee === 0
                  ? 'Free delivery'
                  : `$${item.deliveryFee.toFixed(2)} delivery`}
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

  const renderDiscoveryContent = () => (
    <ScrollView
      style={styles.discoveryScroll}
      contentContainerStyle={styles.discoveryContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Popular Categories */}
      <View style={styles.discoverySection}>
        <Text style={styles.discoverySectionTitle}>Popular Categories</Text>
        <View style={styles.popularCategoryGrid}>
          {categories
            .filter((cat) => POPULAR_CATEGORIES.includes(cat.name))
            .map((cat) => (
              <TouchableOpacity
                key={`popular-${cat.id}`}
                style={styles.popularCategoryCard}
                onPress={() => handlePopularCategoryPress(cat.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.popularCategoryEmoji}>{cat.icon}</Text>
                <Text style={styles.popularCategoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      {/* Browse All Categories */}
      <View style={styles.discoverySection}>
        <Text style={styles.discoverySectionTitle}>Browse All</Text>
        {categories.map((cat) => (
          <TouchableOpacity
            key={`browse-${cat.id}`}
            style={styles.browseCategoryRow}
            onPress={() => handlePopularCategoryPress(cat.name)}
            activeOpacity={0.7}
          >
            <View style={styles.browseCategoryLeft}>
              <View style={styles.browseCategoryIcon}>
                <Text style={styles.browseCategoryEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.browseCategoryName}>{cat.name}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.gray[400]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );

  const renderResultsHeader = () => (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultsCount}>
        {searchResults.length} {searchResults.length === 1 ? 'restaurant' : 'restaurants'} found
        {selectedCategory ? ` in ${selectedCategory}` : ''}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.text.light} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search restaurants, cuisines, dishes..."
            placeholderTextColor={Colors.text.light}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

      {/* Category Filter Chips */}
      <View style={styles.chipContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryChip}
          keyExtractor={categoryKeyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {/* Content */}
      {isShowingResults ? (
        searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderRestaurantCard}
            keyExtractor={resultKeyExtractor}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListHeaderComponent={renderResultsHeader}
          />
        ) : (
          renderEmptyState()
        )
      ) : (
        renderDiscoveryContent()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Search Header
  searchHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    padding: 0,
  },

  // Category Chips
  chipContainer: {
    paddingBottom: Spacing.sm,
  },
  chipList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipEmoji: {
    fontSize: FontSize.md,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },

  // Results List
  resultsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  resultsHeader: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  resultsCount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  // Result Card
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  resultImageContainer: {
    width: 120,
    height: 130,
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
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
    gap: 2,
    backgroundColor: Colors.gray[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Cuisine Tags
  cuisineTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  cuisineTag: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  cuisineTagText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
  },

  // Meta Info
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text.light,
    marginHorizontal: Spacing.xs,
  },
  deliveryFee: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFilterButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  clearFilterText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },

  // Discovery Content
  discoveryScroll: {
    flex: 1,
  },
  discoveryContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  discoverySection: {
    marginBottom: Spacing.xxl,
  },
  discoverySectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  // Popular Category Grid
  popularCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  popularCategoryCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2) / 3,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  popularCategoryEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  popularCategoryName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Browse All Category Rows
  browseCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  browseCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  browseCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseCategoryEmoji: {
    fontSize: 20,
  },
  browseCategoryName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
