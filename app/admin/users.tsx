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
import { useAdminStore, User } from '@/store/adminStore';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'customer';
  phone: string;
  is_active: boolean;
}

const INITIAL_FORM_DATA: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'customer',
  phone: '',
  is_active: true,
};

export default function UsersManagement() {
  const insets = useSafeAreaInsets();
  const {
    users,
    isLoadingUsers,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUser,
    clearError,
  } = useAdminStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    setFormData(INITIAL_FORM_DATA);
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      is_active: user.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
            } catch {
              // Error handled by store
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (user: User) => {
    try {
      await toggleUser(user.id);
    } catch {
      // Error handled by store
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    if (!editingUser && !formData.password) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete (updateData as Partial<UserFormData>).password;
        }
        await updateUser(editingUser.id, updateData);
      } else {
        await createUser(formData);
      }
      setModalVisible(false);
      setFormData(INITIAL_FORM_DATA);
    } catch {
      // Error handled by store
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitial}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.phone && (
            <Text style={styles.userPhone}>{item.phone}</Text>
          )}
          <View style={styles.badges}>
            <View style={[styles.roleBadge, item.role === 'admin' ? styles.adminBadge : styles.customerBadge]}>
              <Text style={[styles.roleText, item.role === 'admin' ? styles.adminText : styles.customerText]}>
                {item.role}
              </Text>
            </View>
            <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
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

  if (isLoadingUsers && users.length === 0) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>{users.length} total users</Text>
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

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUser}
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
                  {editingUser ? 'Edit User' : 'Add User'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter full name"
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Password {editingUser && '(leave blank to keep unchanged)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter password"
                  secureTextEntry
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      formData.role === 'customer' && styles.roleButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, role: 'customer' })}
                  >
                    <Ionicons
                      name="person"
                      size={20}
                      color={formData.role === 'customer' ? Colors.white : Colors.text.secondary}
                    />
                    <Text style={[
                      styles.roleButtonText,
                      formData.role === 'customer' && styles.roleButtonTextActive,
                    ]}>
                      Customer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      formData.role === 'admin' && styles.roleButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, role: 'admin' })}
                  >
                    <Ionicons
                      name="shield"
                      size={20}
                      color={formData.role === 'admin' ? Colors.white : Colors.text.secondary}
                    />
                    <Text style={[
                      styles.roleButtonText,
                      formData.role === 'admin' && styles.roleButtonTextActive,
                    ]}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>
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
                    {editingUser ? 'Update User' : 'Create User'}
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  userDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  adminBadge: {
    backgroundColor: '#6366F120',
  },
  customerBadge: {
    backgroundColor: '#10B98120',
  },
  roleText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  adminText: {
    color: '#6366F1',
  },
  customerText: {
    color: '#10B981',
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
  userActions: {
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
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  roleButtonTextActive: {
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
