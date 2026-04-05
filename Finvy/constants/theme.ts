import { Platform } from 'react-native';

// ── Existing exports (used by themed components & useThemeColor) ──

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ── Finvy Design System ──

export const Theme = {
  bg: '#0A0A0F',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.08)',
  accent: '#A66CFF',
  accentSecondary: '#FF6B6B',
  textPrimary: '#FFFFFF',
  textBody: '#E8E8ED',
  textMuted: '#666666',
  tabActive: '#A66CFF',
  tabInactive: '#555555',
  separator: 'rgba(255,255,255,0.04)',
  borderRadius: { card: 18, button: 14, input: 10 },
} as const;

export type CategoryType =
  | 'Streaming'
  | 'Music'
  | 'Software'
  | 'Gaming'
  | 'Cloud'
  | 'News'
  | 'Fitness'
  | 'Other';

export const CategoryColors: Record<CategoryType, string> = {
  Streaming: '#FF6B6B',
  Music: '#A66CFF',
  Software: '#45B7D1',
  Gaming: '#96E6A1',
  Cloud: '#FFB347',
  News: '#FF8ED4',
  Fitness: '#6BCB77',
  Other: '#B4B4B4',
};

export const CategoryIcons: Record<CategoryType, string> = {
  Streaming: 'tv-outline',
  Music: 'musical-notes-outline',
  Software: 'code-slash-outline',
  Gaming: 'game-controller-outline',
  Cloud: 'cloud-outline',
  News: 'newspaper-outline',
  Fitness: 'fitness-outline',
  Other: 'ellipsis-horizontal-circle-outline',
};

// ── Currencies ──

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rateToUSD: number; // how many units of this currency = 1 USD
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rateToUSD: 1 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭', rateToUSD: 56.20 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rateToUSD: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rateToUSD: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rateToUSD: 150.5 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', rateToUSD: 1380 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', rateToUSD: 7.25 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rateToUSD: 83.5 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rateToUSD: 1.55 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', rateToUSD: 1.36 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', rateToUSD: 1.35 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', rateToUSD: 4.72 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', rateToUSD: 35.8 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', rateToUSD: 15900 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳', rateToUSD: 25400 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', rateToUSD: 5.05 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽', rateToUSD: 17.15 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', rateToUSD: 0.88 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', rateToUSD: 10.85 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', rateToUSD: 1.72 },
];

export function convertCurrency(amount: number, from: CurrencyInfo, to: CurrencyInfo): number {
  if (from.code === to.code) return amount;
  const usdAmount = amount / from.rateToUSD;
  return usdAmount * to.rateToUSD;
}

export type BillingCycle = 'monthly' | 'yearly' | 'weekly';

export type ReminderOffset = 0 | 1 | 3 | 7 | -1;
// 0 = same day, 1 = 1 day before, 3 = 3 days before, 7 = 1 week before, -1 = don't remind me

export const REMINDER_OPTIONS: { value: ReminderOffset; label: string }[] = [
  { value: 0, label: 'Same day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
  { value: -1, label: "Don't remind me" },
];

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  cycle: BillingCycle;
  category: CategoryType;
  startDate: string;
  nextBillingDate: string;
  lastUsed: string;
  active: boolean;
  notes?: string;
  icon?: string;
  reminderOffset: ReminderOffset;
}

// ── Credit Cards ──

export type CardNetwork = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Other';

export const CardNetworkColors: Record<CardNetwork, string> = {
  Visa: '#1A1F71',
  Mastercard: '#EB001B',
  Amex: '#006FCF',
  Discover: '#FF6000',
  Other: '#888888',
};

export const CARD_COLORS = [
  '#1A1A2E', '#0F3460', '#533483', '#2B2D42',
  '#3D0000', '#1B4332', '#2C3E50', '#4A0E4E',
] as const;

export const CARD_NETWORKS: CardNetwork[] = ['Visa', 'Mastercard', 'Amex', 'Discover', 'Other'];

export interface CreditCardPayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  lastFourDigits: string;
  network: CardNetwork;
  color: string;
  creditLimit: number;
  currentBalance: number;
  statementBalance: number;
  minimumPayment: number;
  statementDate: number;
  dueDate: number;
  apr: number;
  active: boolean;
  notes?: string;
  reminderOffset: ReminderOffset;
  payments: CreditCardPayment[];
}

// ── Bills ──

export type BillCategory =
  | 'Electricity'
  | 'Water'
  | 'Internet'
  | 'Rent'
  | 'Grocery'
  | 'Food & Delivery'
  | 'Shopping'
  | 'Gas'
  | 'Insurance'
  | 'Phone'
  | 'Transportation'
  | 'Other';

export const BillCategoryColors: Record<BillCategory, string> = {
  Electricity: '#FFB347',
  Water: '#45B7D1',
  Internet: '#A66CFF',
  Rent: '#FF6B6B',
  Grocery: '#6BCB77',
  'Food & Delivery': '#FF8ED4',
  Shopping: '#E6A1FF',
  Gas: '#FF6B6B',
  Insurance: '#96E6A1',
  Phone: '#45B7D1',
  Transportation: '#B4B4B4',
  Other: '#888888',
};

export const BillCategoryIcons: Record<BillCategory, string> = {
  Electricity: 'flash-outline',
  Water: 'water-outline',
  Internet: 'wifi-outline',
  Rent: 'home-outline',
  Grocery: 'cart-outline',
  'Food & Delivery': 'fast-food-outline',
  Shopping: 'bag-outline',
  Gas: 'flame-outline',
  Insurance: 'shield-checkmark-outline',
  Phone: 'phone-portrait-outline',
  Transportation: 'car-outline',
  Other: 'ellipsis-horizontal-circle-outline',
};

export const BILL_CATEGORIES: BillCategory[] = [
  'Electricity', 'Water', 'Internet', 'Rent', 'Grocery',
  'Food & Delivery', 'Shopping', 'Gas', 'Insurance', 'Phone', 'Transportation', 'Other',
];

export type BillFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

export interface BillPayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Bill {
  id: string;
  name: string;
  category: BillCategory;
  amount: number;
  frequency: BillFrequency;
  dueDate: number;           // day of month (1-31)
  active: boolean;
  autoPay: boolean;
  trackSpending: boolean;    // true = budget category (log expenses against it), false = fixed bill (pay once)
  notes?: string;
  reminderOffset: ReminderOffset;
  payments: BillPayment[];
}

// ── Expenses & Budget ──

export type ExpenseCategory = BillCategory | 'Entertainment' | 'Health' | 'Education' | 'Personal';

export const ExpenseCategoryColors: Record<ExpenseCategory, string> = {
  ...BillCategoryColors,
  Entertainment: '#A66CFF',
  Health: '#FF6B6B',
  Education: '#45B7D1',
  Personal: '#FFB347',
};

export const ExpenseCategoryIcons: Record<ExpenseCategory, string> = {
  ...BillCategoryIcons,
  Entertainment: 'film-outline',
  Health: 'medkit-outline',
  Education: 'school-outline',
  Personal: 'person-outline',
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Delivery', 'Shopping', 'Grocery', 'Transportation',
  'Entertainment', 'Health', 'Education', 'Personal',
  'Electricity', 'Water', 'Internet', 'Rent',
  'Gas', 'Insurance', 'Phone', 'Other',
];

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  date: string; // ISO date
}

export type IncomeFrequency = 'monthly' | 'yearly' | 'one-time';

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  active: boolean;
}

// ── Loans ──

export type LoanType = 'Car' | 'Personal' | 'Home' | 'Student' | 'Business' | 'Other';

export const LoanTypeColors: Record<LoanType, string> = {
  Car: '#45B7D1',
  Personal: '#A66CFF',
  Home: '#FF6B6B',
  Student: '#FFB347',
  Business: '#96E6A1',
  Other: '#B4B4B4',
};

export const LoanTypeIcons: Record<LoanType, string> = {
  Car: 'car-outline',
  Personal: 'person-outline',
  Home: 'home-outline',
  Student: 'school-outline',
  Business: 'briefcase-outline',
  Other: 'ellipsis-horizontal-circle-outline',
};

export const LOAN_TYPES: LoanType[] = ['Car', 'Personal', 'Home', 'Student', 'Business', 'Other'];

export interface LoanPayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  type: LoanType;
  principalAmount: number;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  dueDate: number;          // day of month (1-31)
  active: boolean;
  notes?: string;
  reminderOffset: ReminderOffset;
  payments: LoanPayment[];
}
