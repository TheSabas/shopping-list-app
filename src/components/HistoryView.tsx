'use client';

import { ListHistory } from '@/types';
import { useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface HistoryViewProps {
  history: ListHistory[];
  onBack: () => void;
  onReuseList: (historyId: number) => void;
  isLoading: boolean;
}

export function HistoryView({
  history,
  onBack,
  onReuseList,
  isLoading,
}: HistoryViewProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const filteredHistory = filter ? history.filter(h => h.action === filter) : history;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        disabled={isLoading}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 mb-4"
      >
        <ArrowLeft size={20} /> Back to Lists
      </button>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Shopping History</h2>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('created')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'created'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setFilter('reused')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'reused'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Reused
          </button>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{filter ? `No ${filter} actions found` : 'No history yet'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((entry) => {
              let data: any = {};
              try {
                data = JSON.parse(entry.data);
              } catch (e) {
                // ignore parse errors
              }

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      {data.name || 'Shopping List'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="capitalize font-medium">{entry.action}</span>
                      {' · '}
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {data.items && (
                      <div className="text-xs text-gray-500 mt-1">
                        {data.items.length} items
                      </div>
                    )}
                  </div>
                  {entry.action === 'created' && (
                    <button
                      onClick={() => onReuseList(entry.id)}
                      disabled={isLoading}
                      className="ml-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <RotateCcw size={16} /> Reuse
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
