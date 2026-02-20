'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchEnrollment, updateEnrollment, Enrollment, CadenceStep } from '../../../lib/api';
import { FormSkeleton } from '../../../components/Skeleton';

export default function EnrollmentPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = Array.isArray(params.id) ? params.id[0] : params.id || '';
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<CadenceStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isCompleted = enrollment?.state.status === 'COMPLETED';

  // Initialize data and steps only once on mount
  useEffect(() => {
    async function init() {
      try {
        const data = await fetchEnrollment(workflowId);
        setEnrollment(data);
        
        // Initialize with existing steps or one SEND_EMAIL step if empty
        if (data.state.steps.length > 0) {
          setSteps(data.state.steps);
        } else {
          setSteps([{ id: `${Date.now()}`, type: 'SEND_EMAIL' as const, subject: '', body: '' }]);
        }
      } catch (err) {
        console.error('Failed to fetch enrollment:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [workflowId]);

  // Refresh enrollment status periodically
  useEffect(() => {
    async function refreshStatus() {
      const data = await fetchEnrollment(workflowId);
      setEnrollment(data);
    }
    
    if (!loading) {
      refreshStatus();
      const interval = setInterval(refreshStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [loading, workflowId]);

  async function handleUpdate() {
    setSuccess('');
    setError('');
    setSaving(true);

    try {
      const updated = await updateEnrollment(workflowId, steps);
      setEnrollment(updated);
      setSuccess('Workflow updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to update workflow:', err);
      setError(err.message || 'Failed to update workflow');
    } finally {
      setSaving(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <FormSkeleton />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-gray-500">Enrollment not found</p>
        <button 
            onClick={() => router.push('/')} 
            className="text-purple-600 hover:underline mt-2 inline-block cursor-pointer"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const totalSteps = enrollment.state.steps.length;
  const currentStep = enrollment.state.currentStepIndex;
  const progressPercent = totalSteps > 0 
    ? Math.round(((isCompleted ? totalSteps : currentStep) / totalSteps) * 100)
    : 0;

  // Status badge component
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      COMPLETED: { 
        bg: 'bg-green-100', 
        text: 'text-green-700',
        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      },
      IN_PROGRESS: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700',
        icon: <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      },
      PENDING: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700',
        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
    };
    const style = styles[status] || styles.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
        {style.icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate duration between two timestamps
  const formatDuration = (startTime: number, endTime: number) => {
    const durationMs = endTime - startTime;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Update a single step
  const updateStep = (index: number, field: string, value: string | number) => {
    const newSteps = [...steps];
    if (newSteps[index]) {
      (newSteps[index] as any)[field] = value;
      setSteps(newSteps);
    }
  };

  // Add new step
  const addStep = () => {
    setSteps([...steps, { id: `${Date.now()}`, type: 'SEND_EMAIL' as const, subject: '', body: '' }]);
  };

  // Remove step
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  // Toggle step type between SEND_EMAIL and WAIT
  const toggleStepType = (index: number) => {
    const newSteps = [...steps];
    const currentStep = newSteps[index];
    if (currentStep.type === 'SEND_EMAIL') {
      newSteps[index] = { id: currentStep.id, type: 'WAIT', seconds: 60 };
    } else {
      newSteps[index] = { id: currentStep.id, type: 'SEND_EMAIL', subject: '', body: '' };
    }
    setSteps(newSteps);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollment Details</h1>
            <p className="text-sm text-gray-500 break-all mt-1 font-mono bg-gray-100 px-2 py-1 rounded">{workflowId}</p>
          </div>
          {getStatusBadge(enrollment.state.status)}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in stagger-1">
        {/* Contact Card */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Contact</h3>
          </div>
          <p className="text-lg font-medium text-gray-900">{enrollment.contactEmail}</p>
        </div>

        {/* Cadence Card */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Cadence</h3>
          </div>
          <p className="text-lg font-medium text-gray-900">{enrollment.cadenceId}</p>
        </div>

        {/* Progress Card */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
              <svg className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Progress</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{progressPercent}%</span>
            <span className="text-sm text-gray-500 mb-1">
              {isCompleted ? 'Complete' : `Step ${Math.min(currentStep + 1, totalSteps)} of ${totalSteps}`}
            </span>
          </div>
          <div className="progress-bar mt-2">
            <div 
              className={`progress-bar-fill ${
                isCompleted ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Timeline */}
      <div className="card overflow-hidden animate-fade-in stagger-2">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Step Timeline</h2>
          <p className="text-blue-100 text-sm">{isCompleted ? 'Completed workflow steps' : 'Manage workflow steps'}</p>
        </div>
        
        <div className="p-5">
          {isCompleted ? (
            /* View-only timeline for completed */
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {enrollment.state.steps.map((step, idx) => {
                  const isCompletedStep = idx < enrollment.state.currentStepIndex;
                  const completionTime = enrollment.state.stepCompletionTimes?.[idx];
                  const prevCompletionTime = idx > 0 ? enrollment.state.stepCompletionTimes?.[idx - 1] : null;
                  
                  return (
                    <div key={step.id || idx} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompletedStep ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {isCompletedStep ? '✓' : idx + 1}
                      </div>
                      <div className={`flex-1 p-3 rounded-lg border ${
                        isCompletedStep ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isCompletedStep ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {step.type}
                          </span>
                        </div>
                        {step.type === 'WAIT' ? (
                          <p className="text-sm text-gray-600">Wait <span className="font-medium">{step.seconds}</span> seconds</p>
                        ) : (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900"><span className="text-gray-500">Subject:</span> {step.subject || '(empty)'}</p>
                            <p className="text-gray-500 truncate"><span className="text-gray-400">Body:</span> {step.body || '(empty)'}</p>
                          </div>
                        )}
                        {isCompletedStep && completionTime && (
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-green-700">
                                ✓ Finished: {formatTimestamp(completionTime)}
                              </span>
                              {prevCompletionTime && (
                                <span className="text-gray-500">
                                  Duration: {formatDuration(prevCompletionTime, completionTime)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Editable timeline for in-progress */
            <div>
              <div className="relative pr-2">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {steps.map((step, idx) => {
                    const isCurrent = idx === enrollment.state.currentStepIndex;
                    const isPending = idx > enrollment.state.currentStepIndex;
                    
                    return (
                      <div key={step.id || idx} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                        {/* Step indicator */}
                        <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          isCurrent ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                        
                        {/* Step content - Editable */}
                        <div className={`flex-1 p-3 rounded-lg border ${isCurrent ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleStepType(idx)}
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                  step.type === 'SEND_EMAIL' 
                                    ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                }`}
                              >
                                {step.type}
                              </button>
                              {isCurrent && (
                                <span className="text-xs text-blue-600 font-medium">In Progress</span>
                              )}
                              {isPending && (
                                <span className="text-xs text-gray-500">Pending</span>
                              )}
                            </div>
                            {steps.length > 1 && (
                              <button
                                onClick={() => removeStep(idx)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          
                          {step.type === 'WAIT' ? (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Wait</label>
                              <input
                                type="number"
                                value={step.seconds}
                                onChange={(e) => updateStep(idx, 'seconds', parseInt(e.target.value) || 0)}
                                className="input w-24"
                                min="1"
                              />
                              <span className="text-sm text-gray-600">seconds</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Subject</label>
                                <input
                                  type="text"
                                  value={step.subject}
                                  onChange={(e) => updateStep(idx, 'subject', e.target.value)}
                                  className="input"
                                  placeholder="Email subject..."
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Body</label>
                                <textarea
                                  value={step.body}
                                  onChange={(e) => updateStep(idx, 'body', e.target.value)}
                                  className="input"
                                  rows={2}
                                  placeholder="Email body..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Add Step Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={addStep}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Step
                </button>
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="btn btn-success w-full"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
                {success && (
                  <p className="text-center text-green-600 text-sm mt-2">{success}</p>
                )}
                {error && (
                  <p className="text-center text-red-600 text-sm mt-2">{error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

