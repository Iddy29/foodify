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
import { useDataStore, Category, MenuItem } from '@/store/dataStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useCartStore } from '@/store/cartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POPULAR_CATEGORIES = ['Pizza', 'Sushi', 'Burgers', 'Healthy', 'Mexican', 'Indian'];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Real data from API
  const {
    categories,
    menuItems,
    searchResults,
    isLoadingMenuItems,
    isLoadingSearch,
    fetchCategories,
    fetchMenuItems,
    search,
  } = useDataStore();

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const addItem = useCartStore((s) => s.addItem);

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  // Handle category param from navigation
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
      setSearchQuery('');
      fetchMenuItems({ category: params.category });
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

  // Auto-focus the search input on mount
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
      return searchResults.menu_items;
    }
    if (selectedCategory) {
      return menuItems;
    }
    return [];
  }, [searchQuery, selectedCategory, searchResults, menuItems]);

  const isShowingResults = searchQuery.trim().length > 0 || selectedCategory !== null;
  const isLoading = isLoadingMenuItems || isLoadingSearch;

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
    fetchMenuItems();
    inputRef.current?.focus();
  }, [fetchMenuItems]);

  const handleCategoryChipPress = useCallback((categoryName: string) => {
    setSelectedCategory((prev) => {
      const newCategory = prev === categoryName ? null : categoryName;
      if (newCategory) {
        fetchMenuItems({ category: newCategory });
      } else {
        fetchMenuItems();
      }
      return newCategory;
    });
    setSearchQuery('');
  }, [fetchMenuItems]);

  const handlePopularCategoryPress = useCallback((categoryName: string) => {
    setSelectedCategory(categoryName);
    setSearchQuery('');
    fetchMenuItems({ category: categoryName });
    Keyboard.dismiss();
  }, [fetchMenuItems]);

  const handleItemPress = useCallback(
    (itemId: string | number) => {
      Keyboard.dismiss();
      router.push(`/menu-item/${itemId}` as Href);
    },
    [router],
  );

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
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.categoryChipImage} />
          ) : (
            <Text style={styles.categoryChipEmoji}>{item.icon || '🍽️'}</Text>
          )}
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

  const renderMenuItem = useCallback(
    ({ item }: { item: MenuItem }) => {
      const favorited = isFavorite('menuItem', item.id.toString());
      return (
        <TouchableOpacity
          style={styles.itemCard}
          onPress={() => handleItemPress(item.id)}
          activeOpacity={0.9}
        >
          <View style={styles.itemImageContainer}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/400x300' }}
              style={styles.itemImage}
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
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.itemFooter}>
              <Text style={styles.itemPrice}>
                ${Number(item.price).toFixed(2)}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [isFavorite, handleFavoriteToggle, handleAddToCart, handleItemPress],
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={Colors.gray[300]} />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your search or filters
      </Text>
      <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
        <Text style={styles.clearButtonText}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.text.light} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search food & dishes..."
            placeholderTextColor={Colors.text.light}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={Colors.text.light} />
            </TouchableOpacity>
          )}
        </View>
        {(searchQuery.length > 0 || selectedCategory) && (
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Scroll */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={categories}
          renderItem={renderCategoryChip}
          keyExtractor={(item) => `cat-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Results or Default Content */}
      {isShowingResults ? (
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : displayResults.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={displayResults}
            renderItem={renderMenuItem}
            keyExtractor={(item) => `result-${item.id}`}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {searchQuery.trim()
                    ? `Search Results (${displayResults.length})`
                    : `${selectedCategory} Items (${displayResults.length})`}
                </Text>
              </View>
            )}
          />
        )
      ) : (
        <ScrollView
          style={styles.defaultContent}
          contentContainerStyle={styles.defaultContentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Popular Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            <View style={styles.popularCategoriesGrid}>
              {POPULAR_CATEGORIES.map((categoryName) => (
                <TouchableOpacity
                  key={categoryName}
                  style={styles.popularCategoryCard}
                  onPress={() => handlePopularCategoryPress(categoryName)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.popularCategoryText}>{categoryName}</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Search Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Search</Text>
            <View style={styles.suggestionChips}>
              {['Pizza', 'Burger', 'Pasta', 'Salad', 'Dessert', 'Drinks'].map(
                (suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setSearchQuery(suggestion);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="search" size={14} color={Colors.text.secondary} />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Browse All */}
          <TouchableOpacity
            style={styles.browseAllButton}
            onPress={() => {
              fetchMenuItems();
              setSelectedCategory('All');
            }}
          >
            <Text style={styles.browseAllText}>Browse All Menu Items</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.sm,
  },
  clearAllButton: {
    paddingHorizontal: Spacing.md,
  },
  clearAllText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoriesSection: {
    paddingBottom: Spacing.md,
  },
  categoryList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...Shadows.small,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
  },
  categoryChipImage: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: Spacing.lg,
  },
  resultsHeader: {
    marginBottom: Spacing.md,
  },
  resultsTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  itemImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  itemImage: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  itemInfo: {
    padding: Spacing.lg,
  },
  itemName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  itemDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  clearButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  clearButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  defaultContent: {
    flex: 1,
  },
  defaultContentInner: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  popularCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  popularCategoryCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  popularCategoryText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...Shadows.small,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  browseAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  browseAllText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
