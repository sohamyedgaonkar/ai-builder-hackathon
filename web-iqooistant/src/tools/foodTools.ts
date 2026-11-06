const MENU: Record<string, { id: string; name: string; price: number }[]> = {
  Starters: [
    { id: 'S1', name: 'Paneer Tikka', price: 250 },
    { id: 'S2', name: 'Chicken Wings', price: 300 },
    { id: 'S3', name: 'Veg Spring Rolls', price: 180 },
  ],
  'Main Course': [
    { id: 'M1', name: 'Butter Chicken', price: 350 },
    { id: 'M2', name: 'Paneer Butter Masala', price: 300 },
    { id: 'M3', name: 'Biryani', price: 280 },
  ],
  Beverages: [
    { id: 'B1', name: 'Masala Chai', price: 50 },
    { id: 'B2', name: 'Cold Coffee', price: 120 },
    { id: 'B3', name: 'Fresh Lime Soda', price: 80 },
  ],
};

export function get_all_items() {
  return MENU;
}

export function browse_menu(category?: string) {
  if (category && MENU[category]) {
    return { [category]: MENU[category] };
  }
  if (category) {
    return `Category '${category}' not found. Available categories: ${Object.keys(MENU).join(', ')}`;
  }
  return MENU;
}

// In-memory cart
interface CartItem {
  item: { id: string; name: string; price: number };
  quantity: number;
}
const cart: Record<string, CartItem> = {};

function get_item_by_id(itemId: string) {
  for (const category of Object.values(MENU)) {
    for (const item of category) {
      if (item.id === itemId) return item;
    }
  }
  return null;
}

export function add_to_cart(item_id: string, quantity: number = 1) {
  if (quantity < 1) return { success: false, error: 'Quantity must be at least 1' };

  const item = get_item_by_id(item_id);
  if (!item) return { success: false, error: `Item '${item_id}' not found in menu` };

  if (cart[item_id]) {
    cart[item_id].quantity += quantity;
  } else {
    cart[item_id] = { item, quantity };
  }

  return {
    success: true,
    message: `Added ${cart[item_id].quantity}x ${item.name} to cart. Cart total: ₹${get_cart_total()}`,
  };
}

export function get_cart_snapshot() {
  return Object.values(cart).map((entry) => ({
    name: entry.item.name,
    quantity: entry.quantity,
    price: entry.item.price,
  }));
}

export function get_cart_total() {
  return Object.values(cart).reduce((total, entry) => total + entry.item.price * entry.quantity, 0);
}

export function view_cart() {
  if (Object.keys(cart).length === 0) {
    return 'Your cart is empty. Use browse_menu to see available items.';
  }
  const snapshot = get_cart_snapshot();
  return { items: snapshot, total: get_cart_total() };
}

import { PayPalService } from '../services/paypalService';

export async function place_order() {
  if (Object.keys(cart).length === 0) {
    return { success: false, error: 'Cart is empty. Add items before placing an order.' };
  }

  const items = get_cart_snapshot();
  const total = get_cart_total();
  const order_id = `ORD-${Date.now()}`;

  try {
    const paypalOrder = await PayPalService.createOrder({
      amountInr: total,
      description: `Zomato Food Order ${order_id} (${items.map(i => `${i.quantity}x ${i.name}`).join(', ')})`,
      orderReferenceId: order_id,
    });

    // Clear cart on successful initiation
    for (const key in cart) delete cart[key];

    return {
      success: true,
      order_id,
      orderId: order_id,
      total,
      amount_usd: paypalOrder.amountUsd,
      paypalOrderId: paypalOrder.id,
      status: 'payment_initiated',
      deepLink: paypalOrder.approvalUrl,
      approvalUrl: paypalOrder.approvalUrl,
      statusUrl: paypalOrder.statusUrl,
      paymentMethod: 'PayPal',
      items,
    };
  } catch (e: any) {
    console.error('[PayPal Order Error]', e);
    return { success: false, error: e.message };
  }
}
