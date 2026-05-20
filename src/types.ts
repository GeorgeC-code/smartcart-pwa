export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export interface ShoppingSession {
  id: string;
  date: string;
  total: number;
  items: CartItem[];
  storeName?: string;
}

export interface AppState {
  budget: number;
  history: ShoppingSession[];
}
