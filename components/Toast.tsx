import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useNotificationStore, type ToastMessage } from '@/store/notificationStore';

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      dismissToast();
    }, duration - 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  }, [translateY, opacity, onDismiss, toast.id]);

  const getIconAndColor = (): { icon: React.ComponentProps<typeof Ionicons>['name']; bgColor: string; iconColor: string } => {
    switch (toast.type) {
      case 'success':
        return { icon: 'checkmark-circle', bgColor: '#ECFDF5', iconColor: Colors.success };
      case 'warning':
        return { icon: 'warning', bgColor: '#FFFBEB', iconColor: '#F59E0B' };
      case 'order_update':
        return { icon: 'bicycle', bgColor: '#FFF5F3', iconColor: Colors.primary };
      case 'info':
      default:
        return { icon: 'information-circle', bgColor: '#EFF6FF', iconColor: '#3B82F6' };
    }
  };

  const { icon, bgColor, iconColor } = getIconAndColor();

  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: bgColor,
        },
      ]}
    >
      <TouchableOpacity
        style={toastStyles.content}
        onPress={dismissToast}
        activeOpacity={0.8}
      >
        <View style={[toastStyles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          {toast.icon ? (
            <Text style={toastStyles.emoji}>{toast.icon}</Text>
          ) : (
            <Ionicons name={icon} size={22} color={iconColor} />
          )}
        </View>
        <View style={toastStyles.textContainer}>
          <Text style={toastStyles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          <Text style={toastStyles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>
        <Ionicons name="close" size={18} color={Colors.text.light} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ToastProvider() {
  const insets = useSafeAreaInsets();
  const toasts = useNotificationStore((s) => s.toasts);
  const removeToast = useNotificationStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  // Only show the most recent toast
  const latestToast = toasts[toasts.length - 1];

  return (
    <View
      style={[
        toastStyles.overlay,
        { top: insets.top + Spacing.sm },
      ]}
      pointerEvents="box-none"
    >
      <ToastItem
        key={latestToast.id}
        toast={latestToast}
        onDismiss={removeToast}
      />
    </View>
  );
}

const toastStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
  },
  container: {
    borderRadius: BorderRadius.lg,
    ...Shadows.large,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
