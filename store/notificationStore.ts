import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Order } from '@/data/mockData';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'order_update';
  icon?: string;
  duration?: number;
}

interface NotificationState {
  toasts: ToastMessage[];
  isSetup: boolean;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setupNotifications: () => Promise<void>;
  sendOrderStatusNotification: (order: Order, newStatus: Order['status']) => Promise<void>;
  updateBadgeCount: (count: number) => Promise<void>;
}

const STATUS_MESSAGES: Record<Order['status'], { title: string; body: string; emoji: string }> = {
  received: {
    title: 'Order Confirmed!',
    body: 'Your order has been received and confirmed.',
    emoji: '📋',
  },
  preparing: {
    title: 'Being Prepared',
    body: 'The restaurant is preparing your delicious food!',
    emoji: '👨‍🍳',
  },
  on_the_way: {
    title: 'Your Rider is Nearby!',
    body: 'Your order is on its way to you. Get ready!',
    emoji: '🚴',
  },
  arrived: {
    title: 'Order Delivered!',
    body: 'Your food has arrived. Enjoy your meal!',
    emoji: '🎉',
  },
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  isSetup: false,

  showToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  setupNotifications: async () => {
    if (get().isSetup) return;

    try {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          // Set up notification channel for Android
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('order-updates', {
              name: 'Order Updates',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF6B52',
              sound: 'default',
            });
          }
        }
      }
      set({ isSetup: true });
    } catch {
      // Silently fail notification setup
      set({ isSetup: true });
    }
  },

  sendOrderStatusNotification: async (order, newStatus) => {
    const statusInfo = STATUS_MESSAGES[newStatus];
    if (!statusInfo) return;

    const title = `${statusInfo.emoji} ${statusInfo.title}`;
    const body = `${order.restaurantName} - ${statusInfo.body}`;

    // Send local push notification
    try {
      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { orderId: order.id, status: newStatus },
            sound: 'default',
          },
          trigger: null, // Send immediately
        });
      }
    } catch {
      // Silently fail
    }

    // Also show in-app toast
    get().showToast({
      title: statusInfo.title,
      message: `${order.restaurantName} - ${statusInfo.body}`,
      type: 'order_update',
      icon: statusInfo.emoji,
      duration: 5000,
    });
  },

  updateBadgeCount: async (count) => {
    try {
      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch {
      // Silently fail
    }
  },
}));
