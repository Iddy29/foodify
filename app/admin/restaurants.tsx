import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminStore, Restaurant } from '@/store/adminStore';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';

interface RestaurantFormData {
  name: string;
  description: string;
  address: string;
  cuisine: string;
  delivery_time: string;
  delivery_fee: string;
  price_range: string;
  distance: string;
  image: string;
  cover_image: string;
  featured: boolean;
  is_active: boolean;
}

const INITIAL_FORM_DATA: RestaurantFormData = {
  name: '',
  description: '',
  address: '',
  cuisine: '',
  delivery_time: '30-45 min',
  delivery_fee: '0',
  price_range: '$$',
  distance: '1.0 miles',
  image: '',
  cover_image: '',
  featured: false,
  is_active: true,
};

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

export default function RestaurantsManagement() {
  const insets = useSafeAreaInsets();
  const {
    restaurants,
    isLoadingRestaurants,
    isLoading,
    error,
    fetchRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    toggleRestaurant,
    toggleRestaurantFeatured,
    clearError,
  } = useAdminStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<RestaurantFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleAdd = () => {
    setEditingRestaurant(null);
    setFormData(INITIAL_FORM_DATA);
    setModalVisible(true);
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      cuisine: restaurant.cuisine.join(', '),
      delivery_time: restaurant.delivery_time,
      delivery_fee: restaurant.delivery_fee.toString(),
      price_range: restaurant.price_range,
      distance: restaurant.distance || '',
      image: restaurant.image || '',
      cover_image: restaurant.cover_image || '',
      featured: restaurant.featured,
      is_active: restaurant.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = (restaurant: Restaurant) => {
    Alert.alert(
      'Delete Restaurant',
      `Are you sure you want to delete "${restaurant.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRestaurant(restaurant.id);
            } catch {
              // Error handled by store
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (restaurant: Restaurant) => {
    try {
      await toggleRestaurant(restaurant.id);
    } catch {
      // Error handled by store
    }
  };

  const handleToggleFeatured = async (restaurant: Restaurant) => {
    try {
      await toggleRestaurantFeatured(restaurant.id);
    } catch {
      // Error handled by store
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Name, description, and address are required');
      return;
    }

    const data = {
      ...formData,
      cuisine: formData.cuisine.split(',').map(c => c.trim()).filter(Boolean),
      delivery_fee: parseFloat(formData.delivery_fee) || 0,
    };

    try {
      if (editingRestaurant) {
        await updateRestaurant(editingRestaurant.id, data);
      } else {
        await createRestaurant(data);
      }
      setModalVisible(false);
      setFormData(INITIAL_FORM_DATA);
    } catch {
      // Error handled by store
    }
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <View style={styles.restaurantCard}>
      <View style={styles.restaurantHeader}>
        <View style={styles.restaurantIcon}>
          <Ionicons name="restaurant" size={24} color={Colors.primary} />
        </View>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{item.delivery_time}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{item.price_range}</Text>
          </View>
          <Text style={styles.cuisineText} numberOfLines={1}>
            {item.cuisine.join(', ')}
          </Text>
        </View>
      </View>

      <View style={styles.badges}>
        {item.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.restaurantActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.featureBtn]}
          onPress={() => handleToggleFeatured(item)}
        >
          <Ionicons
            name={item.featured ? 'star' : 'star-outline'}
            size={18}
            color={item.featured ? '#F59E0B' : Colors.text.light}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.toggleBtn]}
          onPress={() => handleToggle(item)}
        >
          <Ionicons
            name={item.is_active ? 'eye' : 'eye-off'}
            size={18}
            color={item.is_active ? Colors.primary : Colors.text.light}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="create-outline" size={18} color={Colors.info} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoadingRestaurants && restaurants.length === 0) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Restaurants</Text>
          <Text style={styles.subtitle}>{restaurants.length} total restaurants</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Restaurants List */}
      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Restaurant Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter restaurant name"
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter description"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter full address"
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: Spacing.md }]}>
                  <Text style={styles.label}>Cuisine Types</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.cuisine}
                    onChangeText={(text) => setFormData({ ...formData, cuisine: text })}
                    placeholder="Italian, Pizza"
                    placeholderTextColor={Colors.text.light}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Price Range</Text>
                  <View style={styles.priceButtons}>
                    {PRICE_RANGES.map((price) => (
                      <TouchableOpacity
                        key={price}
                        style={[
                          styles.priceButton,
                          formData.price_range === price && styles.priceButtonActive,
                        ]}
                        onPress={() => setFormData({ ...formData, price_range: price })}
                      >
                        <Text style={[
                          styles.priceButtonText,
                          formData.price_range === price && styles.priceButtonTextActive,
                        ]}>
                          {price}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: Spacing.md }]}>
                  <Text style={styles.label}>Delivery Time</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.delivery_time}
                    onChangeText={(text) => setFormData({ ...formData, delivery_time: text })}
                    placeholder="30-45 min"
                    placeholderTextColor={Colors.text.light}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Delivery Fee ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.delivery_fee}
                    onChangeText={(text) => setFormData({ ...formData, delivery_fee: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.text.light}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Logo Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.image}
                  onChangeText={(text) => setFormData({ ...formData, image: text })}
                  placeholder="https://..."
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Cover Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.cover_image}
                  onChangeText={(text) => setFormData({ ...formData, cover_image: text })}
                  placeholder="https://..."
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: Spacing.md }]}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Featured</Text>
                    <TouchableOpacity
                      style={[
                        styles.switch,
                        formData.featured ? styles.switchActive : styles.switchInactive,
                      ]}
                      onPress={() => setFormData({ ...formData, featured: !formData.featured })}
                    >
                      <View style={[styles.switchThumb, formData.featured && styles.switchThumbActive]} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Active</Text>
                    <TouchableOpacity
                      style={[
                        styles.switch,
                        formData.is_active ? styles.switchActive : styles.switchInactive,
                      ]}
                      onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    >
                      <View style={[styles.switchThumb, formData.is_active && styles.switchThumbActive]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingRestaurant ? 'Update Restaurant' : 'Create Restaurant'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.danger,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSize.sm,
  },
  listContent: {
    padding: Spacing.lg,
  },
  restaurantCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  restaurantHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  restaurantIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#F59E0B',
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  cuisineText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  featuredText: {
    color: '#F59E0B',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  activeBadge: {
    backgroundColor: '#10B98120',
  },
  inactiveBadge: {
    backgroundColor: '#EF444420',
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  activeText: {
    color: '#10B981',
  },
  inactiveText: {
    color: '#EF4444',
  },
  restaurantActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureBtn: {
    backgroundColor: Colors.gray[100],
  },
  toggleBtn: {
    backgroundColor: Colors.gray[100],
  },
  editBtn: {
    backgroundColor: '#3B82F620',
  },
  deleteBtn: {
    backgroundColor: '#EF444420',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priceButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priceButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
  },
  priceButtonActive: {
    backgroundColor: Colors.primary,
  },
  priceButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  priceButtonTextActive: {
    color: Colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  switchActive: {
    backgroundColor: Colors.primary,
  },
  switchInactive: {
    backgroundColor: Colors.gray[300],
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    transform: [{ translateX: 0 }],
  },
  switchThumbActive: {
    transform: [{ translateX: 24 }],
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
