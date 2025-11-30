export interface ShoppingItem {
  id?: number;
  list_id?: number;
  name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  created_at?: string;
}

export interface ShoppingList {
  id?: number;
  user_id?: number;
  name: string;
  items: ShoppingItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ListHistory {
  id: number;
  user_id: number;
  original_list_id: number | null;
  action: string;
  data: string;
  created_at: string;
}
