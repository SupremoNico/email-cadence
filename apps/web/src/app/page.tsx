'use client';
import { useState, useEffect } from 'react';
import { fetchCadences, fetchEnrollments, startEnrollment, Cadence } from '../lib/api';
import { StatsCardSkeleton } from '../components/Skeleton';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCadences: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  // Quick enroll state
  const [cadences, setCadences] = useState<Cadence[]>([]);
  const [selectedCadenceId, setSelectedCadenceId] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [cadenceError, setCadenceError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  // Recent enrollments
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [cadencesData, enrollments] = await Promise.all([
          fetchCadences(),
          fetchEnrollments(),
        ]);

        const completed = enrollments.filter(
          (e: any) => e.state.status === 'COMPLETED'
        ).length;

        setStats({
          totalCadences: cadencesData.length,
          activeEnrollments: enrollments.length - completed,
          completedEnrollments: completed,
        });

        // Load cadences for quick enroll
        setCadences(cadencesData);

        // Get recent enrollments (last 5, sorted: non-completed first, then by recency)
        const sortedEnrollments = [...enrollments].sort((a: any, b: any) => {
          // Get timestamp from workflowId (format: cadence_timestamp)
          const getTimestamp = (enrollment: any) => {
            const match = enrollment.workflowId.match(/cad_(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };

          const aStatus = a.state.status;
          const bStatus = b.state.status;
          const aCompleted = aStatus === 'COMPLETED';
          const bCompleted = bStatus === 'COMPLETED';

          // Non-completed enrollments first
          if (aCompleted !== bCompleted) {
            return aCompleted ? 1 : -1;
          }
          // Then sort by timestamp (newest first)
          return getTimestamp(b) - getTimestamp(a);
        });
        setRecentEnrollments(sortedEnrollments.slice(0, 3));
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle quick enrollment
  async function handleQuickEnroll(e: React.FormEvent) {
    e.preventDefault();

    // Reset error states
    setCadenceError(false);
    setEmailError(false);
    setEnrollError('');
    setEnrollSuccess('');

    // Validate inputs
    let hasError = false;
    if (!selectedCadenceId) {
      setCadenceError(true);
      hasError = true;
    }
    if (!enrollEmail.trim()) {
      setEmailError(true);
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(enrollEmail)) {
        setEnrollError('Please enter a valid email address');
        setEmailError(true);
        hasError = true;
      }
    }

    if (hasError) return;

    setEnrollLoading(true);

    try {
      const enrollment = await startEnrollment(selectedCadenceId, enrollEmail);
      setEnrollSuccess('Enrollment started!');
      setSelectedCadenceId('');
      setEnrollEmail('');
      // Navigate to the enrollment page
      router.push(`/enrollments/${enrollment.workflowId}`);
    } catch (err) {
      setEnrollError('Failed to start enrollment');
      console.error(err);
    } finally {
      setEnrollLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Total Cadences',
      value: stats.totalCadences,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Total Enrollments',
      value: stats.activeEnrollments + stats.completedEnrollments,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      label: 'Active Enrollments',
      value: stats.activeEnrollments,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Completed',
      value: stats.completedEnrollments,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your email campaigns and track enrollments</p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => (
            <div
              key={idx}
              className={`card p-4 flex items-center gap-4 animate-fade-in stagger-${idx + 1}`}
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Cadence Card */}
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create New Cadence</h3>
            <p className="text-sm text-gray-500">Set up a new email sequence</p>
          </div>
        </div>

        <button
          onClick={() => {
            router.push('/cadences/new');
          }}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Cadence
        </button>
      </div>

      {/* Quick Enroll Card */}
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Enroll</h3>
            <p className="text-sm text-gray-500">Start a new enrollment instantly</p>
          </div>
        </div>

        {cadences.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No cadences available. Please create one to quick enroll.</p>
          </div>
        ) : (
          <form onSubmit={handleQuickEnroll} className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCadenceId}
              onChange={(e) => {
                setSelectedCadenceId(e.target.value);
                if (e.target.value) setCadenceError(false);
              }}
              className={`input flex-1 ${cadenceError ? 'border-red-500 focus:border-red-500' : ''}`}
              required
            >
              <option value="">Select a cadence...</option>
              {cadences.map((cadence) => (
                <option key={cadence.id} value={cadence.id}>
                  {cadence.name} ({cadence.steps.length} step{cadence.steps.length !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
            <input
              type="email"
              value={enrollEmail}
              onChange={(e) => {
                setEnrollEmail(e.target.value);
                if (e.target.value) setEmailError(false);
              }}
              placeholder="Contact email..."
              className={`input flex-1 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
              required
            />
            <button
              type="submit"
              disabled={enrollLoading}
              className="btn btn-primary cursor-pointer"
            >
              {enrollLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enrolling...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Enroll
                </>
              )}
            </button>
          </form>
        )}
        {enrollError && (
          <p className="text-red-500 text-sm mt-3">{enrollError}</p>
        )}
        {enrollSuccess && (
          <p className="text-green-600 text-sm mt-3">{enrollSuccess}</p>
        )}
      </div>

      {/* Recent Enrollments Card */}
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Enrollments</h3>
              <p className="text-sm text-gray-500">Latest enrollment progress</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/enrollments')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
          >
            View all
          </button>
        </div>

        {recentEnrollments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No enrollments yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEnrollments.map((enrollment: any) => {
              const progress = enrollment.state.steps.length > 0
                ? Math.round(((enrollment.state.currentStepIndex + (enrollment.state.status === 'COMPLETED' ? 1 : 0)) / enrollment.state.steps.length) * 100)
                : 0;

              return (
                <div
                  key={enrollment.workflowId}
                  onClick={() => router.push(`/enrollments/${enrollment.workflowId}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{enrollment.contactEmail}</p>
                    <p className="text-xs text-gray-500 truncate">{enrollment.cadenceId}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${enrollment.state.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${enrollment.state.status === 'COMPLETED' ? 'text-green-600' :
                        enrollment.state.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                      {enrollment.state.status === 'COMPLETED' ? 'Done' :
                        enrollment.state.status === 'IN_PROGRESS' ? `${progress}%` : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

