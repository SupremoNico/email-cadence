'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CadenceEditor from '../../../components/CadenceEditor';
import { Cadence, fetchCadences, updateCadence, createCadence } from '../../../lib/api';
import { FormSkeleton } from '../../../components/Skeleton';

export default function CadencePage() {
  const params = useParams();
  const router = useRouter();
  const cadenceId = params.id as string;
  const isNew = cadenceId === 'new';
  
  const [cadence, setCadence] = useState<Cadence | null>(null);
  const [originalCadence, setOriginalCadence] = useState<Cadence | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error'>('error');
  const [nameError, setNameError] = useState(false);

  const hasChanges = isNew ? ((cadence?.name?.trim() || '') !== '' || (cadence?.steps?.length ?? 0) > 0) : JSON.stringify(cadence) !== JSON.stringify(originalCadence);

  useEffect(() => {
    if (isNew) {
      const newCadence: Cadence = {
        id: '',
        name: '',
        steps: [],
      };
      setCadence(newCadence);
      setOriginalCadence(newCadence);
      setLoading(false);
    } else {
      fetchCadences()
        .then(all => {
          const found = all.find(c => c.id === cadenceId) || null;
          setCadence(found);
          setOriginalCadence(found);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [cadenceId, isNew]);

  async function handleSave() {
    if (!cadence) return;
    
    // Validate name - don't allow empty name
    if (!cadence.name.trim()) {
      setNameError(true);
      return;
    }
    
    setSaving(true);
    setSaveMessage('');
    setNameError(false);
    
    try {
      if (isNew) {
        // Create new cadence first
        const created = await createCadence(cadence.name);
        // Update with steps if any
        if (cadence.steps.length > 0) {
          await updateCadence(created.id, cadence.steps, cadence.name);
        }
        setSaveMessage('Cadence created successfully!');
        setSaveMessageType('success');
        setTimeout(() => {
          router.replace(`/cadences/${created.id}`);
        }, 1500);
      } else {
        await updateCadence(cadence.id, cadence.steps, cadence.name);
        setOriginalCadence(cadence);
        setSaveMessage('Saved successfully!');
        setSaveMessageType('success');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      setSaveMessage('Failed to save');
      setSaveMessageType('error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    router.back();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <FormSkeleton />
      </div>
    );
  }

  if (!cadence && !isNew) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-gray-500">Cadence not found</p>
          <button onClick={() => router.push('/cadences')} className="text-purple-600 hover:underline mt-2 inline-block">
            Go back to cadences
          </button>
        </div>
      </div>
    );
  }

  // For new cadence, if cadence is null, show loading
  if (!cadence) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <FormSkeleton />
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
            <input
              type="text"
              value={cadence.name}
              onChange={(e) => {
                setCadence({ ...cadence, name: e.target.value });
                if (nameError) setNameError(false);
              }}
              placeholder="Enter cadence name..."
              className={`text-2xl font-bold bg-transparent focus:outline-none w-full cursor-text placeholder-gray-400 ${
                nameError ? 'text-red-600 placeholder-red-400' : 'text-gray-900'
              }`}
            />
          </div>
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className={`text-sm font-medium ${saveMessageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`btn ${hasChanges ? 'btn-primary' : 'btn-secondary'}`}
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
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Card */}
      <div className="card overflow-hidden animate-fade-in stagger-1">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Cadence Steps</h2>
          <p className="text-purple-100 text-sm">Configure the email sequence for this cadence</p>
        </div>
        <div className="p-5">
          <CadenceEditor
            initialSteps={cadence.steps}
            onChange={steps => setCadence({ ...cadence, steps })}
          />
        </div>
      </div>
    </div>
  );
}

