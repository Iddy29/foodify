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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminStore, Category } from '@/store/adminStore';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';

interface CategoryFormData {
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const INITIAL_FORM_DATA: CategoryFormData = {
  name: '',
  icon: '🍽️',
  sort_order: 0,
  is_active: true,
};

const EMOJI_OPTIONS = ['🍽️', '🍕', '🍔', '🍣', '🥗', '🍝', '🍰', '🌮', '🥡', '🍛', '🦐', '🍜', '🍷', '☕', '🥪'];

export default function CategoriesManagement() {
  const insets = useSafeAreaInsets();
  const {
    categories,
    isLoadingCategories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    clearError,
  } = useAdminStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData(INITIAL_FORM_DATA);
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon || '🍽️',
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
            } catch {
              // Error is handled by store
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (category: Category) => {
    try {
      await toggleCategory(category.id);
    } catch {
      // Error is handled by store
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      setModalVisible(false);
      setFormData(INITIAL_FORM_DATA);
    } catch {
      // Error is handled by store
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryIcon}>{item.icon || '🍽️'}</Text>
        <View style={styles.categoryDetails}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryMeta}>
            Sort: {item.sort_order} • {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.categoryActions}>
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

  if (isLoadingCategories && categories.length === 0) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.subtitle}>{categories.length} total categories</Text>
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

      {/* Categories List */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter category name"
                placeholderTextColor={Colors.text.light}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Icon</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      formData.icon === emoji && styles.emojiSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, icon: emoji })}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Sort Order</Text>
              <TextInput
                style={styles.input}
                value={formData.sort_order.toString()}
                onChangeText={(text) => setFormData({ ...formData, sort_order: parseInt(text) || 0 })}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor={Colors.text.light}
              />
            </View>

            <View style={styles.formGroup}>
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

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Text>
              )}
            </TouchableOpacity>
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
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  categoryMeta: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  emojiText: {
    fontSize: 24,
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
