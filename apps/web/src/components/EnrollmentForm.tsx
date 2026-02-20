'use client';
import { useState } from 'react';
import { startEnrollment, Cadence } from '../lib/api';

interface Props {
  cadence: Cadence;
  onSuccess?: (workflowId: string) => void;
}

export default function EnrollmentForm({ cadence, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

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

    setLoading(true);

    try {
      const enrollment = await startEnrollment(cadence.id, email);
      setSuccess(`Enrollment started! Workflow ID: ${enrollment.workflowId}`);
      setEmail('');
      if (onSuccess) {
        onSuccess(enrollment.workflowId);
      }
    } catch (err) {
      setError('Failed to start enrollment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded p-4">
      <h3 className="text-lg font-semibold mb-2">Enroll in: {cadence.name}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Contact Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border px-3 py-2 rounded"
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {success && (
          <p className="text-green-600 text-sm">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-green-400"
        >
          {loading ? 'Enrolling...' : 'Start Enrollment'}
        </button>
      </form>
    </div>
  );
}

