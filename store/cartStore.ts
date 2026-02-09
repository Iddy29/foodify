import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OrderItem, Order } from '@/data/mockData';

const CART_STORAGE_KEY = '@foodify_cart';
const ORDERS_STORAGE_KEY = '@foodify_orders';

interface CartState {
  items: OrderItem[];
  orders: Order[];
  isLoaded: boolean;
  addItem: (item: OrderItem) => void;
  removeItem: (menuItemId: string, sizeName: string) => void;
  updateQuantity: (menuItemId: string, sizeName: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getActiveOrders: () => Order[];
  getActiveOrderCount: () => number;
  loadFromStorage: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orders: [],
  isLoaded: false,

  addItem: (item: OrderItem) => {
    const { items } = get();
    const existingIndex = items.findIndex(
      (i) =>
        i.menuItem.id === item.menuItem.id &&
        i.selectedSize.name === item.selectedSize.name
    );

    let newItems: OrderItem[];
    if (existingIndex >= 0) {
      newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + item.quantity,
      };
    } else {
      newItems = [...items, item];
    }

    set({ items: newItems });
    saveCartToStorage(newItems);
  },

  removeItem: (menuItemId: string, sizeName: string) => {
    const newItems = get().items.filter(
      (i) => !(i.menuItem.id === menuItemId && i.selectedSize.name === sizeName)
    );
    set({ items: newItems });
    saveCartToStorage(newItems);
  },

  updateQuantity: (menuItemId: string, sizeName: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId, sizeName);
      return;
    }

    const newItems = get().items.map((i) =>
      i.menuItem.id === menuItemId && i.selectedSize.name === sizeName
        ? { ...i, quantity }
        : i
    );
    set({ items: newItems });
    saveCartToStorage(newItems);
  },

  clearCart: () => {
    set({ items: [] });
    saveCartToStorage([]);
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => total + item.selectedSize.price * item.quantity,
      0
    );
  },

  getDeliveryFee: () => {
    const items = get().items;
    if (items.length === 0) return 0;
    return 2.99; // Mock delivery fee
  },

  getTotal: () => {
    return get().getSubtotal() + get().getDeliveryFee();
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },

  addOrder: (order: Order) => {
    const newOrders = [order, ...get().orders];
    set({ orders: newOrders });
    saveOrdersToStorage(newOrders);
  },

  updateOrderStatus: (orderId: string, status: Order['status']) => {
    const newOrders = get().orders.map((o) =>
      o.id === orderId ? { ...o, status } : o
    );
    set({ orders: newOrders });
    saveOrdersToStorage(newOrders);
  },

  getActiveOrders: () => {
    return get().orders.filter((o) => o.status !== 'arrived');
  },

  getActiveOrderCount: () => {
    return get().orders.filter((o) => o.status !== 'arrived').length;
  },

  loadFromStorage: async () => {
    try {
      const [cartData, ordersData] = await Promise.all([
        AsyncStorage.getItem(CART_STORAGE_KEY),
        AsyncStorage.getItem(ORDERS_STORAGE_KEY),
      ]);
      const items = cartData ? JSON.parse(cartData) : [];
      const orders = ordersData ? JSON.parse(ordersData) : [];
      set({ items, orders, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));

async function saveCartToStorage(items: OrderItem[]) {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Silently fail - cart will be lost on restart
  }
}

async function saveOrdersToStorage(orders: Order[]) {
  try {
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Silently fail
  }
}
