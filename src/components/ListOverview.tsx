'use client';

import { ShoppingList as ShoppingListType } from '@/types';
import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface ListOverviewProps {
  lists: ShoppingListType[];
  onCreateNew: () => void;
  onSelectList: (list: ShoppingListType) => void;
  isLoading: boolean;
}

export function ListOverview({
  lists,
  onCreateNew,
  onSelectList,
  isLoading,
}: ListOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Active Shopping Lists</h2>
        <button
          onClick={onCreateNew}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} /> New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="bg-gray-50 p-12 rounded-lg border-2 border-dashed border-gray-300 text-center">
          <p className="text-gray-600 mb-4">No active shopping lists yet</p>
          <button
            onClick={onCreateNew}
            disabled={isLoading}
            className="inline-block bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Create Your First List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => {
            const itemCount = list.items?.length || 0;
            const purchasedCount = list.items?.filter(i => i.purchased).length || 0;
            const progress = itemCount > 0 ? Math.round((purchasedCount / itemCount) * 100) : 0;

            return (
              <button
                key={list.id}
                onClick={() => onSelectList(list)}
                disabled={isLoading}
                className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all disabled:opacity-50 cursor-pointer"
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{list.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{itemCount} items</span>
                    <span>{progress}% done</span>
                  </div>
                  {itemCount > 0 && (
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(list.updated_at || list.created_at || '').toLocaleDateString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
