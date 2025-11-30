'use client';

import { useEffect, useState } from 'react';
import { ShoppingList as ShoppingListType, ListHistory } from '@/types';
import { ListOverview } from '@/components/ListOverview';
import { ActiveList } from '@/components/ActiveList';
import { HistoryView } from '@/components/HistoryView';
import {
  createList,
  getUserLists,
  getList,
  getHistory,
  reuseList,
} from '@/lib/api';
import { ShoppingBag, History } from 'lucide-react';

type View = 'overview' | 'active' | 'history';

export default function Home() {
  const [view, setView] = useState<View>('overview');
  const [lists, setLists] = useState<ShoppingListType[]>([]);
  const [history, setHistory] = useState<ListHistory[]>([]);
  const [activeList, setActiveList] = useState<ShoppingListType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    loadLists();
    loadHistory();
  }, []);

  const loadLists = async () => {
    try {
      const data = await getUserLists();
      setLists(data || []);
    } catch (err) {
      console.error('Failed to load lists', err);
      setError('Failed to load lists');
      setTimeout(() => setError(''), 3000);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setError('List name is required');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const list = await createList(newListName);
      setLists([list, ...lists]);
      setNewListName('');
      setError('');
    } catch (err) {
      setError('Failed to create list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectList = async (list: ShoppingListType) => {
    setIsLoading(true);
    try {
      if (list.id) {
        const fullList = await getList(list.id);
        setActiveList(fullList);
      }
      setView('active');
    } catch (err) {
      setError('Failed to load list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleListUpdated = (updatedList: ShoppingListType) => {
    if (updatedList.id) {
      setLists(lists.map(l => l.id === updatedList.id ? updatedList : l));
    }
    loadHistory();
  };

  const handleListDeleted = () => {
    if (activeList?.id) {
      setLists(lists.filter(l => l.id !== activeList.id));
    }
    loadHistory();
  };

  const handleReuseList = async (historyId: number) => {
    setIsLoading(true);
    try {
      const newList = await reuseList(historyId);
      setLists([newList, ...lists]);
      setView('overview');
      setError('');
    } catch (err) {
      setError('Failed to reuse list');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag size={28} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Shopping List App</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Lists
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                view === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <History size={18} /> History
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {view === 'overview' && !newListName && (
          <>
            <ListOverview
              lists={lists}
              onCreateNew={() => setNewListName('New List')}
              onSelectList={handleSelectList}
              isLoading={isLoading}
            />
          </>
        )}

        {view === 'overview' && newListName !== '' && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Shopping List</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter list name (e.g., Weekly Groceries)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
                autoFocus
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateList}
                  disabled={isLoading || !newListName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium"
                >
                  Create List
                </button>
                <button
                  onClick={() => setNewListName('')}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'active' && activeList && (
          <ActiveList
            list={activeList}
            onBack={() => {
              setView('overview');
              setActiveList(null);
              loadLists();
            }}
            onListUpdated={handleListUpdated}
            onListDeleted={handleListDeleted}
          />
        )}

        {view === 'history' && (
          <HistoryView
            history={history}
            onBack={() => {
              setView('overview');
              loadLists();
            }}
            onReuseList={handleReuseList}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}
