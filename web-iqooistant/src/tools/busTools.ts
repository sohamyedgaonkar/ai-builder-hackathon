// Mocked Bus Catalog
const BUSES = [
  { operator: 'Neeta Travels', type: 'Volvo AC Sleeper', route: 'Mumbai -> Goa', departure: '21:00', arrival: '08:00', price: 1500, rating: 4.2 },
  { operator: 'VRL Travels', type: 'Scania AC Semi-Sleeper', route: 'Mumbai -> Goa', departure: '22:30', arrival: '09:30', price: 1200, rating: 4.5 },
  { operator: 'RSRTC', type: 'AC Seater', route: 'Delhi -> Jaipur', departure: '06:00', arrival: '11:00', price: 600, rating: 4.0 },
  { operator: 'Zingbus', type: 'Premium AC Sleeper', route: 'Delhi -> Jaipur', departure: '23:30', arrival: '05:00', price: 900, rating: 4.6 },
  { operator: 'Shivneri (MSRTC)', type: 'Volvo AC Seater', route: 'Pune -> Mumbai', departure: '08:00', arrival: '11:30', price: 550, rating: 4.7 },
];

export function search_buses() {
  return { success: true, buses: BUSES };
}

// In-memory bus cart
let bus_cart: any = null;

export function select_bus(operator_name: string, seats: number = 1) {
  if (seats < 1) return { success: false, error: 'Seats must be at least 1' };

  const bus = BUSES.find((b) => b.operator.toLowerCase().includes(operator_name.toLowerCase()));
  if (!bus) return { success: false, error: `Bus matching '${operator_name}' not found` };

  bus_cart = {
    bus,
    seats,
    totalPrice: bus.price * seats,
  };

  return {
    success: true,
    message: `Selected ${seats} seat(s) on ${bus.operator} (${bus.route}). Total: ₹${bus_cart.totalPrice}`,
  };
}

import { PayPalService } from '../services/paypalService';

export async function book_bus() {
  if (!bus_cart) {
    return { success: false, error: 'No bus selected. Search and select a bus before booking.' };
  }

  const total = bus_cart.totalPrice;
  const booking_id = `BUS-${Date.now()}`;
  const busInfo = bus_cart.bus;

  try {
    const paypalOrder = await PayPalService.createOrder({
      amountInr: total,
      description: `RedBus ${busInfo.operator} (${busInfo.route}) - ${bus_cart.seats} Seat(s)`,
      orderReferenceId: booking_id,
    });

    const items = [{ id: busInfo.operator, name: `${busInfo.operator} (${busInfo.route})`, quantity: bus_cart.seats, price: busInfo.price }];

    // Clear bus cart on successful initiation
    bus_cart = null;

    return {
      success: true,
      booking_id,
      orderId: booking_id,
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
    console.error('[PayPal Bus Order Error]', e);
    return { success: false, error: e.message };
  }
}
