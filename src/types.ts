export type Language = 'en' | 'de' | 'es' | 'ru';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: 'each' | 'kg';
  completed: boolean;
}

export interface ShoppingTrip {
  id: string;
  date: string; // ISO / Date string
  storeName: string;
  items: CartItem[];
  total: number;
  budgetAtTrip: number;
}

export interface Settings {
  budget: number;
  soundEnabled: boolean;
  isPremium: boolean;
  language: Language;
}
