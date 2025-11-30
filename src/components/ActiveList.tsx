'use client';

import { ShoppingList as ShoppingListType } from '@/types';
import { useState } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { ItemForm, ItemList } from './ItemForm';
import { createItem, deleteItem, updateItem, deleteList } from '@/lib/api';

interface ActiveListProps {
  list: ShoppingListType;
  onBack: () => void;
  onListUpdated: (list: ShoppingListType) => void;
  onListDeleted: () => void;
}

export function ActiveList({
  list,
  onBack,
  onListUpdated,
  onListDeleted,
}: ActiveListProps) {
  const [items, setItems] = useState<ShoppingListType['items']>(list.items || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddItem = async (newItem: Omit<ShoppingListType['items'][0], 'id' | 'list_id'>) => {
    if (!list.id) return;
    setIsLoading(true);
    setError('');
    try {
      const item = await createItem(list.id, newItem.name, newItem.quantity, newItem.unit);
      setItems([...items, item]);
      setSuccess('Item added!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePurchased = async (item: ShoppingListType['items'][0]) => {
    if (!item.id) return;
    setIsLoading(true);
    try {
      const updated = await updateItem(item.id, item.name, item.quantity, item.unit, !item.purchased);
      setItems(items.map(i => i.id === item.id ? updated : i));
    } catch (err) {
      setError('Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      await deleteItem(itemId);
      setItems(items.filter(i => i.id !== itemId));
      setSuccess('Item deleted!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to delete item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDone = async () => {
    if (!list.id) return;
    setIsLoading(true);
    try {
      const updatedList = { ...list, items };
      onListUpdated(updatedList);
      setSuccess('Shopping list marked as done!');
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err) {
      setError('Failed to mark list as done');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteList = async () => {
    if (!list.id) return;
    if (!window.confirm('Are you sure you want to delete this list?')) return;
    
    setIsLoading(true);
    try {
      await deleteList(list.id);
      onListDeleted();
      setSuccess('List deleted!');
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      setError('Failed to delete list');
    } finally {
      setIsLoading(false);
    }
  };

  const purchasedCount = items.filter(i => i.purchased).length;
  const totalCount = items.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
        >
          <ArrowLeft size={20} /> Back to Lists
        </button>
        <button
          onClick={handleDeleteList}
          disabled={isLoading}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          title="Delete list"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{list.name}</h2>
        <div className="text-sm text-gray-600">
          {totalCount > 0 && (
            <p>
              Progress: <span className="font-semibold">{purchasedCount}/{totalCount}</span> items purchased
            </p>
          )}
          {totalCount > 0 && (
            <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-lg text-gray-900">Add Items</h3>
        <ItemForm onAddItem={handleAddItem} isLoading={isLoading} />
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-lg text-gray-900">Items ({totalCount})</h3>
        <ItemList
          items={items}
          onTogglePurchased={handleTogglePurchased}
          onDeleteItem={handleDeleteItem}
          isLoading={isLoading}
        />
      </div>

      <button
        onClick={handleMarkDone}
        disabled={isLoading || totalCount === 0}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <Save size={20} /> Mark Shopping List as Done
      </button>
    </div>
  );
}
