'use client';

import { ShoppingItem } from '@/types';
import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface ItemFormProps {
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'list_id'>) => void;
  isLoading: boolean;
}

export function ItemForm({ onAddItem, isLoading }: ItemFormProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    onAddItem({
      name: name.trim(),
      quantity: qty,
      unit: unit.trim() || 'pcs',
      purchased: false,
    });

    setName('');
    setQuantity('1');
    setUnit('pcs');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="space-y-2">
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <input
          type="text"
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Quantity"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <input
            type="text"
            placeholder="Unit (pcs, kg, etc)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Add Item
      </button>
    </form>
  );
}

interface ItemListProps {
  items: ShoppingItem[];
  onTogglePurchased: (item: ShoppingItem) => void;
  onDeleteItem: (itemId: number) => void;
  isLoading: boolean;
}

export function ItemList({ items, onTogglePurchased, onDeleteItem, isLoading }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No items yet. Add your first item above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <input
            type="checkbox"
            checked={item.purchased}
            onChange={() => onTogglePurchased(item)}
            disabled={isLoading}
            className="w-5 h-5 text-green-600 rounded cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex-1">
            <span
              className={`block ${
                item.purchased
                  ? 'line-through text-gray-400'
                  : 'text-gray-900'
              }`}
            >
              {item.name}
            </span>
            <span className="text-xs text-gray-500">
              {item.quantity} {item.unit}
            </span>
          </div>
          <button
            onClick={() => item.id && onDeleteItem(item.id)}
            disabled={isLoading}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
