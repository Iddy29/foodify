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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAdminStore, MenuItem, Restaurant } from '@/store/adminStore';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';

interface MenuItemFormData {
  restaurant_id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  ingredients: string;
  popular: boolean;
  is_active: boolean;
}

interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

const INITIAL_FORM_DATA: MenuItemFormData = {
  restaurant_id: 0,
  name: '',
  description: '',
  price: '',
  category: '',
  image: '',
  ingredients: '',
  popular: false,
  is_active: true,
};

export default function ProductsManagement() {
  const insets = useSafeAreaInsets();
  const {
    menuItems,
    restaurants,
    isLoadingMenuItems,
    isLoadingRestaurants,
    isLoading,
    error,
    fetchMenuItems,
    fetchRestaurants,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItem,
    toggleMenuItemPopular,
    clearError,
  } = useAdminStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>(INITIAL_FORM_DATA);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);

  useEffect(() => {
    fetchMenuItems();
    fetchRestaurants();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM_DATA);
    setSelectedImage(null);
    setModalVisible(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      restaurant_id: item.restaurant_id,
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image || '',
      ingredients: item.ingredients?.join(', ') || '',
      popular: item.popular,
      is_active: item.is_active,
    });
    setSelectedImage(null);
    setModalVisible(true);
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItem(item.id);
            } catch {
              // Error handled by store
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (item: MenuItem) => {
    try {
      await toggleMenuItem(item.id);
    } catch {
      // Error handled by store
    }
  };

  const handleTogglePopular = async (item: MenuItem) => {
    try {
      await toggleMenuItemPopular(item.id);
    } catch {
      // Error handled by store
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.restaurant_id || !formData.price || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean),
    };

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data, selectedImage || undefined);
      } else {
        await createMenuItem(data, selectedImage || undefined);
      }
      setModalVisible(false);
      setFormData(INITIAL_FORM_DATA);
      setSelectedImage(null);
    } catch {
      // Error handled by store
    }
  };

  const filteredItems = selectedRestaurant
    ? menuItems.filter(item => item.restaurant_id === selectedRestaurant)
    : menuItems;

  const renderProduct = ({ item }: { item: MenuItem }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <View style={styles.productIcon}>
          <Ionicons name="fast-food" size={24} color={Colors.primary} />
        </View>
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productMeta}>
            ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || '0').toFixed(2)} • {item.category}
          </Text>
          <Text style={styles.productRestaurant}>
            {item.restaurant?.name || 'Unknown Restaurant'}
          </Text>
          <View style={styles.badges}>
            {item.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Popular</Text>
              </View>
            )}
            <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.popularBtn]}
          onPress={() => handleTogglePopular(item)}
        >
          <Ionicons
            name={item.popular ? 'star' : 'star-outline'}
            size={18}
            color={item.popular ? '#F59E0B' : Colors.text.light}
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

  if ((isLoadingMenuItems || isLoadingRestaurants) && menuItems.length === 0) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>{filteredItems.length} products</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Restaurant Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedRestaurant === null && styles.filterChipActive]}
          onPress={() => setSelectedRestaurant(null)}
        >
          <Text style={[styles.filterText, selectedRestaurant === null && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {restaurants.map((restaurant) => (
          <TouchableOpacity
            key={restaurant.id}
            style={[styles.filterChip, selectedRestaurant === restaurant.id && styles.filterChipActive]}
            onPress={() => setSelectedRestaurant(restaurant.id)}
          >
            <Text style={[styles.filterText, selectedRestaurant === restaurant.id && styles.filterTextActive]}>
              {restaurant.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={filteredItems}
        renderItem={renderProduct}
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
                  {editingItem ? 'Edit Product' : 'Add Product'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Restaurant *</Text>
                <View style={styles.restaurantChips}>
                  {restaurants.map((restaurant) => (
                    <TouchableOpacity
                      key={restaurant.id}
                      style={[
                        styles.restaurantChip,
                        formData.restaurant_id === restaurant.id && styles.restaurantChipActive,
                      ]}
                      onPress={() => setFormData({ ...formData, restaurant_id: restaurant.id })}
                    >
                      <Text style={[
                        styles.restaurantChipText,
                        formData.restaurant_id === restaurant.id && styles.restaurantChipTextActive,
                      ]}>
                        {restaurant.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter product name"
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

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: Spacing.md }]}>
                  <Text style={styles.label}>Price *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.text.light}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Category *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.category}
                    onChangeText={(text) => setFormData({ ...formData, category: text })}
                    placeholder="e.g. Appetizers"
                    placeholderTextColor={Colors.text.light}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Image</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                  ) : formData.image ? (
                    <Image source={{ uri: formData.image }} style={styles.selectedImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={32} color={Colors.text.light} />
                      <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {(selectedImage || formData.image) && (
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => {
                      setSelectedImage(null);
                      setFormData({ ...formData, image: '' });
                    }}
                  >
                    <Text style={styles.removeImageText}>Remove Image</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ingredients (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.ingredients}
                  onChangeText={(text) => setFormData({ ...formData, ingredients: text })}
                  placeholder="tomato, cheese, basil"
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: Spacing.md }]}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Popular</Text>
                    <TouchableOpacity
                      style={[
                        styles.switch,
                        formData.popular ? styles.switchActive : styles.switchInactive,
                      ]}
                      onPress={() => setFormData({ ...formData, popular: !formData.popular })}
                    >
                      <View style={[styles.switchThumb, formData.popular && styles.switchThumbActive]} />
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
                    {editingItem ? 'Update Product' : 'Create Product'}
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
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.white,
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
  productCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  productMeta: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  productRestaurant: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  popularBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  popularText: {
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
  productActions: {
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
  popularBtn: {
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
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
  },
  imagePlaceholderText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text.light,
  },
  removeImageBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'center',
  },
  removeImageText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  restaurantChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  restaurantChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
  },
  restaurantChipActive: {
    backgroundColor: Colors.primary,
  },
  restaurantChipText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  restaurantChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
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
