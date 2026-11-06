export interface User {
  name: string;
  email: string;
  paypalId: string;
  phone: string;
  upiId: string;
  walletBalance: number;
  walletBalanceUsd: number;
  linkedAccount: string;
  cardMasked: string;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'sent' | 'received' | 'recharge' | 'bill';
  date: string;
  note?: string;
}

export interface Contact {
  id: string;
  name: string;
  upiId: string;
  color: string;
}

export interface Bank {
  id: string;
  name: string;
  accountMasked: string;
  type: string;
  balance: number;
}

export const currentUser: User = {
  name: 'Prasad Rao',
  email: 'prasad-buyer@sandbox.paypal.com',
  paypalId: 'PP-SB-98214',
  phone: '+91-98765-43210',
  upiId: 'prasad@paypal',
  walletBalance: 12450,
  walletBalanceUsd: 150.0,
  linkedAccount: 'PayPal Balance & Chase Visa',
  cardMasked: '•••• 4242',
};

export const transactions: Transaction[] = [
  {id: 't1', name: 'Zomato Foods', amount: 120, type: 'sent', date: '2026-11-06', note: 'PayPal Sandbox Order'},
  {id: 't2', name: 'PayPal Balance Top-up', amount: 5000, type: 'received', date: '2026-11-05'},
  {id: 't3', name: 'MakeMyTrip Hotels', amount: 2499, type: 'sent', date: '2026-11-04', note: 'PayPal Booking'},
  {id: 't4', name: 'Rahul Sharma', amount: 1200, type: 'received', date: '2026-11-03', note: 'Split bill'},
  {id: 't5', name: 'Blinkit Groceries', amount: 350, type: 'sent', date: '2026-11-02', note: 'Instant checkout'},
];

export const contacts: Contact[] = [
  {id: 'c1', name: 'Amit', upiId: 'amit@paypal', color: '#003087'},
  {id: 'c2', name: 'Rahul', upiId: 'rahul@paypal', color: '#0070BA'},
  {id: 'c3', name: 'Priya', upiId: 'priya@paypal', color: '#007934'},
];

export const banks: Bank[] = [
  {id: 'b1', name: 'PayPal Balance', accountMasked: 'USD ($150.00)', type: 'Primary Wallet', balance: 12450},
  {id: 'b2', name: 'Chase Visa Card', accountMasked: '•••• 4242', type: 'Backup Method', balance: 45000},
];

export const mobilePlans = [
  {id: 'p1', operator: 'Airtel', amount: 299, validity: '28 days', data: '2GB/day'},
  {id: 'p2', operator: 'Airtel', amount: 399, validity: '56 days', data: '2GB/day'},
  {id: 'p3', operator: 'Jio', amount: 239, validity: '28 days', data: '1.5GB/day'},
  {id: 'p4', operator: 'Jio', amount: 349, validity: '28 days', data: '2GB/day'},
];

export const billCategories = [
  {id: 'bc1', name: 'Electricity', icon: 'flash-on'},
  {id: 'bc2', name: 'Water', icon: 'water-drop'},
  {id: 'bc3', name: 'Gas', icon: 'local-fire-department'},
  {id: 'bc4', name: 'Broadband', icon: 'wifi'},
];
