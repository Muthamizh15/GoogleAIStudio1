
export type BillingCycle = 'monthly' | 'yearly' | 'quarterly' | 'half-yearly' | 'every-28-days';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  category: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  description?: string;
  
  // Enhanced Payment Details
  paymentType?: string; // e.g. 'Credit Card', 'UPI', 'NetBanking'
  paymentDetails?: string; // e.g. 'HDFC Regalia **** 1234'
  notes?: string;
  
  active: boolean;
}

export interface SpendingCategory {
  name: string;
  total: number;
  color: string;
}

export const CATEGORIES = [
  'Entertainment',
  'Software',
  'Utilities',
  'Health & Fitness',
  'Mobile & Data',
  'Insurance',
  'Loan/EMI',
  'Education',
  'Finance',
  'Housing',
  'Other'
];

export const PAYMENT_TYPES = [
  'Credit Card',
  'Debit Card',
  'UPI',
  'Net Banking',
  'Auto-Debit',
  'Cash',
  'Wallet',
  'Other'
];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD'];
