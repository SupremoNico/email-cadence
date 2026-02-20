'use client';
import { useState, useEffect } from 'react';
import { Cadence, updateCadence } from '../lib/api';
import CadenceEditor from './CadenceEditor';

interface Props {
  cadence: Cadence;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCadence: Cadence) => void;
}

export default function CadenceModal({ cadence, isOpen, onClose, onSave }: Props) {
  const [localCadence, setLocalCadence] = useState<Cadence>(cadence);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // If steps are empty, initialize with one SEND_EMAIL step
    const initialSteps = cadence.steps.length === 0
      ? [{ id: `${Date.now()}`, type: 'SEND_EMAIL' as const, subject: '', body: '' }]
      : cadence.steps;
    setLocalCadence({ ...cadence, steps: initialSteps });
  }, [cadence]);

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSave() {
    setSaving(true);
    setSaveMessage('');
    try {
      await updateCadence(localCadence.id, localCadence.steps);
      setSaveMessage('Saved successfully!');
      onSave({ ...localCadence });
      setTimeout(() => {
        setSaveMessage('');
        onClose();
      }, 1500);
    } catch (error) {
      setSaveMessage('Failed to save');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 animate-scale-in">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {cadence.steps.length === 0 ? 'Create Steps: ' : 'Edit: '}{localCadence.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <CadenceEditor
            initialSteps={localCadence.steps}
            onChange={(steps) => setLocalCadence({ ...localCadence, steps })}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </>
            )}
          </button>
          {saveMessage && (
            <p
              className={`text-center font-medium mt-2 ${
                saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {saveMessage}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}