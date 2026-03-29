import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAdminStore } from '@/store/adminStore';
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
  is_active: boolean;
}

interface ImageFile {
  uri: string;
  name: string;
  type: string;
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
  is_active: true,
};

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

export default function RestaurantSettings() {
  const insets = useSafeAreaInsets();
  const {
    restaurant,
    isLoadingRestaurant,
    isLoading,
    error,
    fetchRestaurant,
    createRestaurant,
    updateRestaurant,
    toggleRestaurant,
    clearError,
  } = useAdminStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>(INITIAL_FORM_DATA);
  const [selectedLogo, setSelectedLogo] = useState<ImageFile | null>(null);
  const [selectedCover, setSelectedCover] = useState<ImageFile | null>(null);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        cuisine: restaurant.cuisine?.join(', ') || '',
        delivery_time: restaurant.delivery_time,
        delivery_fee: restaurant.delivery_fee.toString(),
        price_range: restaurant.price_range,
        distance: restaurant.distance || '',
        image: restaurant.image || '',
        cover_image: restaurant.cover_image || '',
        is_active: restaurant.is_active,
      });
    }
  }, [restaurant]);

  const handlePickImage = async (type: 'logo' | 'cover') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageFile = {
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        type: asset.mimeType || 'image/jpeg',
      };
      if (type === 'logo') {
        setSelectedLogo(imageFile);
      } else {
        setSelectedCover(imageFile);
      }
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
      const imageFiles = {
        ...(selectedLogo && { image: selectedLogo }),
        ...(selectedCover && { cover_image: selectedCover }),
      };

      if (restaurant) {
        await updateRestaurant(data, Object.keys(imageFiles).length > 0 ? imageFiles : undefined);
      } else {
        await createRestaurant(data, Object.keys(imageFiles).length > 0 ? imageFiles : undefined);
      }
      setIsEditing(false);
      setSelectedLogo(null);
      setSelectedCover(null);
    } catch {
      // Error handled by store
    }
  };

  const handleToggle = async () => {
    try {
      await toggleRestaurant();
    } catch {
      // Error handled by store
    }
  };

  if (isLoadingRestaurant && !restaurant) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // View Mode
  if (!isEditing && restaurant) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Restaurant</Text>
              <Text style={styles.subtitle}>Manage your restaurant settings</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={20} color={Colors.white} />
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

          {/* Cover Image */}
          <View style={styles.coverContainer}>
            {restaurant.cover_image ? (
              <Image source={{ uri: restaurant.cover_image }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverImage, styles.coverPlaceholder]}>
                <Ionicons name="image-outline" size={48} color={Colors.text.light} />
              </View>
            )}
            {/* Logo */}
            <View style={styles.logoContainer}>
              {restaurant.image ? (
                <Image source={{ uri: restaurant.image }} style={styles.logoImage} />
              ) : (
                <View style={[styles.logoImage, styles.logoPlaceholder]}>
                  <Ionicons name="restaurant" size={32} color={Colors.text.light} />
                </View>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[styles.statusBadge, restaurant.is_active ? styles.activeBadge : styles.inactiveBadge]}
              onPress={handleToggle}
            >
              <Ionicons
                name={restaurant.is_active ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={restaurant.is_active ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.statusText, restaurant.is_active ? styles.activeText : styles.inactiveText]}>
                {restaurant.is_active ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.description}>{restaurant.description}</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.infoText}>{restaurant.address}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.infoText}>{restaurant.delivery_time}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="car-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.infoText}>${restaurant.delivery_fee}</Text>
              </View>
            </View>

            {restaurant.cuisine && restaurant.cuisine.length > 0 && (
              <View style={styles.cuisineContainer}>
                {restaurant.cuisine.map((c, i) => (
                  <View key={i} style={styles.cuisineTag}>
                    <Text style={styles.cuisineText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Edit/Create Mode
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{restaurant ? 'Edit Restaurant' : 'Create Restaurant'}</Text>
            <Text style={styles.subtitle}>
              {restaurant ? 'Update your restaurant details' : 'Set up your restaurant'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setIsEditing(false)}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
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

        <View style={styles.formContainer}>
          {/* Logo Image */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Logo Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => handlePickImage('logo')}>
              {selectedLogo ? (
                <Image source={{ uri: selectedLogo.uri }} style={styles.selectedImage} />
              ) : formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="restaurant-outline" size={32} color={Colors.text.light} />
                  <Text style={styles.imagePlaceholderText}>Tap to select logo</Text>
                </View>
              )}
            </TouchableOpacity>
            {(selectedLogo || formData.image) && (
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => {
                  setSelectedLogo(null);
                  setFormData({ ...formData, image: '' });
                }}
              >
                <Text style={styles.removeImageText}>Remove Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cover Image */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cover Image</Text>
            <TouchableOpacity style={[styles.imagePicker, styles.coverImagePicker]} onPress={() => handlePickImage('cover')}>
              {selectedCover ? (
                <Image source={{ uri: selectedCover.uri }} style={styles.selectedImage} />
              ) : formData.cover_image ? (
                <Image source={{ uri: formData.cover_image }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color={Colors.text.light} />
                  <Text style={styles.imagePlaceholderText}>Tap to select cover image</Text>
                </View>
              )}
            </TouchableOpacity>
            {(selectedCover || formData.cover_image) && (
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => {
                  setSelectedCover(null);
                  setFormData({ ...formData, cover_image: '' });
                }}
              >
                <Text style={styles.removeImageText}>Remove Cover</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name */}
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

          {/* Description */}
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

          {/* Address */}
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

          {/* Cuisine & Price Range */}
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

          {/* Delivery Time & Fee */}
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

          {/* Distance */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Distance</Text>
            <TextInput
              style={styles.input}
              value={formData.distance}
              onChangeText={(text) => setFormData({ ...formData, distance: text })}
              placeholder="1.0 miles"
              placeholderTextColor={Colors.text.light}
            />
          </View>

          {/* Active Toggle */}
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Restaurant Active</Text>
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

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {restaurant ? 'Update Restaurant' : 'Create Restaurant'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  // View Mode Styles
  coverContainer: {
    position: 'relative',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  coverImage: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.xl,
  },
  coverPlaceholder: {
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -30,
    left: Spacing.lg,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    borderWidth: 4,
    borderColor: Colors.white,
    ...Shadows.medium,
  },
  logoPlaceholder: {
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  activeBadge: {
    backgroundColor: '#10B98120',
  },
  inactiveBadge: {
    backgroundColor: '#EF444420',
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  activeText: {
    color: '#10B981',
  },
  inactiveText: {
    color: '#EF4444',
  },
  section: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  restaurantName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cuisineTag: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  cuisineText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Edit Mode Styles
  formContainer: {
    padding: Spacing.lg,
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
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  coverImagePicker: {
    width: '100%',
    height: 160,
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
    textAlign: 'center',
  },
  removeImageBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  removeImageText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '600',
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
