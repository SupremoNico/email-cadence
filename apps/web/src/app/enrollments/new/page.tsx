'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCadences, startEnrollment, Cadence } from '../../../lib/api';

export default function NewEnrollmentPage() {
  const router = useRouter();
  const [cadences, setCadences] = useState<Cadence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCadenceId, setSelectedCadenceId] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadCadences() {
      try {
        const data = await fetchCadences();
        setCadences(data);
        if (data.length > 0) {
          setSelectedCadenceId(data[0].id);
        }
      } catch (err) {
        setError('Failed to load cadences');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCadences();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCadenceId) {
      setError('Please select a cadence');
      return;
    }

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      const enrollment = await startEnrollment(selectedCadenceId, email);
      setSuccess('Enrollment created successfully!');
      setTimeout(() => {
        router.push(`/enrollments/${enrollment.workflowId}`);
      }, 1500);
    } catch (err) {
      setError('Failed to create enrollment. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    router.back();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-16 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <h1 className="text-2xl font-bold text-gray-900">New Enrollment</h1>
          </div>
        </div>
      </div>

      {cadences.length === 0 ? (
        <div className="card p-8 text-center animate-fade-in stagger-1">
          <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium mb-2">No cadences available</p>
          <p className="text-gray-400 text-sm mb-4">Create a cadence first before enrolling contacts</p>
          <button
            onClick={() => router.push('/cadences/new')}
            className="btn btn-primary"
          >
            Create Cadence
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade-in stagger-1">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white">Enrollment Details</h2>
            <p className="text-purple-100 text-sm">Select a cadence and enter contact email</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Cadence Selection */}
            <div>
              <label htmlFor="cadence" className="block text-sm font-medium text-gray-700 mb-1">
                Select Cadence
              </label>
              <select
                id="cadence"
                value={selectedCadenceId}
                onChange={(e) => setSelectedCadenceId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {cadences.map((cadence) => (
                  <option key={cadence.id} value={cadence.id}>
                    {cadence.name} ({cadence.steps.length} steps)
                  </option>
                ))}
              </select>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {/* Success Message */}
            {success && (
              <p className="text-green-600 text-sm">{success}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Enrollment
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

