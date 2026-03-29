import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

interface MenuRow {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const orders = useCartStore((s) => s.orders);

  const totalOrders = orders.length;
  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // _layout.tsx sees token = null and renders <Redirect href="/login" />
          },
        },
      ],
    );
  }, [logout]);

  const isAdmin = user?.role === 'admin';

  const menuRows: MenuRow[] = [
    {
      icon: 'receipt-outline',
      label: 'My Orders',
      value: `${totalOrders} order${totalOrders !== 1 ? 's' : ''}`,
      onPress: () => router.push('/(tabs)/orders' as any),
    },
    {
      icon: 'heart-outline',
      label: 'Favourites',
      onPress: () => router.push('/(tabs)/favorites' as any),
    },
    {
      icon: 'cart-outline',
      label: 'Cart',
      onPress: () => router.push('/(tabs)/cart' as any),
    },
  ];

  // Admin menu items
  const adminRows: MenuRow[] = isAdmin
    ? [
        {
          icon: 'shield-checkmark',
          label: 'Admin Panel',
          onPress: () => router.push('/admin' as any),
        },
      ]
    : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {/* spacer to centre the title */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? '—'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>

          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
          </View>
        </View>

        {/* Menu rows */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuRows.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              style={[
                styles.menuRow,
                i < menuRows.length - 1 && styles.menuRowBorder,
              ]}
              onPress={row.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={row.icon} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{row.label}</Text>
              </View>
              <View style={styles.menuRowRight}>
                {row.value ? (
                  <Text style={styles.menuValue}>{row.value}</Text>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Admin section - only for admin users */}
        {isAdmin && adminRows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>
            {adminRows.map((row, i) => (
              <TouchableOpacity
                key={row.label}
                style={[
                  styles.menuRow,
                  i < adminRows.length - 1 && styles.menuRowBorder,
                ]}
                onPress={row.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#6366F120' }]}>
                    <Ionicons name={row.icon} size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.menuLabel}>{row.label}</Text>
                </View>
                <View style={styles.menuRowRight}>
                  {row.value ? (
                    <Text style={styles.menuValue}>{row.value}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },

  // Avatar card
  avatarCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.medium,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.large,
  },
  avatarInitial: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.white,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginTop: 2,
  },

  // Menu section
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text.light,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuValue: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.error,
    ...Shadows.small,
  },
  signOutText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.error,
  },
});
