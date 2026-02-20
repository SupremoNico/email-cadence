'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchEnrollments, Enrollment } from '../../lib/api';
import { ListItemSkeleton } from '../../components/Skeleton';

export default function EnrollmentsPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEnrollments() {
    try {
      const data = await fetchEnrollments();
      setEnrollments(data);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnrollments();
    const interval = setInterval(loadEnrollments, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      COMPLETED: {
        bg: 'badge-success',
        text: 'text-green-700',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      IN_PROGRESS: {
        bg: 'badge-primary',
        text: 'text-primary',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
      PENDING: {
        bg: 'badge-warning',
        text: 'text-yellow-700',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    };
    const style = styles[status] || styles.PENDING;
    return (
      <span className={`badge ${style.bg} ${style.text === 'text-primary' ? '' : style.text} inline-flex items-center gap-1`}>
        {style.icon}
        {status}
      </span>
    );
  };

  const getProgress = (enrollment: Enrollment) => {
    const totalSteps = enrollment.state.steps.length;
    const currentStep = enrollment.state.currentStepIndex;
    const isCompleted = enrollment.state.status === 'COMPLETED';
    const progressPercent = totalSteps > 0
      ? Math.round(((isCompleted ? totalSteps : currentStep) / totalSteps) * 100)
      : 0;
    return { progressPercent, totalSteps, currentStep, isCompleted };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Enrollments</h1>
          <p className="text-gray-500 mt-1">View and manage all email cadence enrollments</p>
        </div>
        <button
          onClick={() => router.push('/enrollments/new')}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Enrollment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in stagger-1">
        <div className="card p-4">
          <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
          <p className="text-sm text-gray-500">Total Enrollments</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-primary">
            {enrollments.filter(e => e.state.status === 'IN_PROGRESS').length}
          </p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-600">
            {enrollments.filter(e => e.state.status === 'COMPLETED').length}
          </p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200 animate-fade-in stagger-2">
          <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No enrollments yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Enroll contacts from a cadence to get started</p>
          <button
            onClick={() => router.push('/enrollments/new')}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create
          </button>
        </div>
      ) : (
        <ul className="space-y-3 animate-fade-in stagger-2">
          {enrollments.map((enrollment, idx) => {
            const progress = getProgress(enrollment);
            return (
              <li 
                key={enrollment.workflowId} 
                className="card p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        progress.isCompleted 
                          ? 'bg-gradient-to-br from-green-400 to-green-600' 
                          : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    }`}>
                      {enrollment.contactEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/enrollments/${enrollment.workflowId}`}
                        className="text-purple-600 hover:text-purple-800 font-semibold block truncate"
                      >
                        {enrollment.contactEmail}
                      </Link>
                      <span className="text-gray-400 text-sm">
                        {progress.isCompleted 
                          ? `Completed ${progress.totalSteps} steps`
                          : `Step ${Math.min(progress.currentStep + 1, progress.totalSteps)} of ${progress.totalSteps}`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(enrollment.state.status)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

