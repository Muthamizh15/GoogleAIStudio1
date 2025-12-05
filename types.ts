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
  paymentMethod?: string; // e.g. "Visa ending 4242"
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
  'Education',
  'Finance',
  'Other'
];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD'];