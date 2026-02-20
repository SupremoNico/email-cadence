'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchCadences, createCadence, deleteCadence, Cadence } from '../lib/api';
import { ListItemSkeleton } from './Skeleton';

export default function CadenceList() {
  const router = useRouter();
  const [cadences, setCadences] = useState<Cadence[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCadences() {
    try {
      const data = await fetchCadences();
      setCadences(data);
    } catch (error) {
      console.error('Failed to fetch cadences:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCadences();
  }, []);

  async function handleDeleteCadence(cadenceId: string) {
    if (!confirm('Are you sure you want to delete this cadence?')) return;
    
    try {
      await deleteCadence(cadenceId);
      setCadences(cadences.filter(c => c.id !== cadenceId));
    } catch (error) {
      console.error('Failed to delete cadence:', error);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Existing Cadences */}
      {cadences.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No cadences yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Click the button below to create your first cadence</p>
          <button
            onClick={() => {
              router.push('/cadences/new');
            }}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create
          </button>
        </div>
      ) : (
        <>          
          {/* Cadence List */}
          <ul className="space-y-2">
            {cadences.map((cadence, idx) => (
              <li 
                key={cadence.id} 
                className="card p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {cadence.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                    <Link
                        href={`/cadences/${cadence.id}`}
                        className="text-purple-600 hover:text-purple-800 font-semibold block truncate transition-colors cursor-pointer"
                      >
                        {cadence.name}
                      </Link>
                      <span className="text-gray-400 text-sm">
                        {cadence.steps.length} step{cadence.steps.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/cadences/${cadence.id}`)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCadence(cadence.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Create Button */}
          <button
            onClick={() => {
              router.push('/cadences/new');
            }}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-all duration-200 flex items-center justify-center gap-2 font-medium cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Cadence
          </button>
        </>
      )}
    </div>
  );
}

