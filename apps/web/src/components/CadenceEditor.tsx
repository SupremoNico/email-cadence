'use client';
import { useState, useEffect } from 'react';
import { CadenceStep } from '../lib/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  initialSteps: CadenceStep[];
  onChange: (steps: CadenceStep[]) => void;
}

function SortableStep({
  step,
  index,
  onChange,
  onDelete,
}: {
  step: CadenceStep;
  index: number;
  onChange: (key: string, value: string | number) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative flex gap-2">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-blue-600 text-white cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        {index + 1}
      </div>
      
      {/* Step content */}
      <div className="flex-1 p-3 rounded-lg border bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <select
              value={step.type}
              onChange={e => onChange('type', e.target.value)}
              className="border px-2 py-1 rounded text-sm font-medium"
            >
              <option value="WAIT">WAIT</option>
              <option value="SEND_EMAIL">SEND_EMAIL</option>
            </select>
          </div>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Delete step"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {step.type === 'WAIT' ? (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Wait</label>
            <input
              type="number"
              value={String(step.seconds ?? 0)}
              onChange={e => {
                const val = e.target.value;
                const num = val === '' ? 0 : Number(val);
                onChange('seconds', num);
              }}
              className="border px-2 py-1 w-24 rounded text-sm"
              placeholder="0"
            />
            <span className="text-sm text-gray-500">seconds</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subject</label>
              <input
                type="text"
                value={step.subject}
                placeholder="Email subject..."
                onChange={e => onChange('subject', e.target.value)}
                className="border px-2 py-1.5 w-full rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Body</label>
              <textarea
                value={step.body}
                placeholder="Email body..."
                onChange={e => onChange('body', e.target.value)}
                className="border px-2 py-1.5 w-full rounded text-sm"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CadenceEditor({ initialSteps, onChange }: Props) {
  const [steps, setSteps] = useState<CadenceStep[]>(initialSteps);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync steps when initialSteps changes (e.g., when parent updates)
  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  function handleStepChange(index: number, key: string, value: string | number) {
    const updated = [...steps];
    const currentStep = updated[index];
    
    if (key === 'type') {
      // When type changes, reset to the appropriate step shape
      if (value === 'WAIT') {
        updated[index] = { id: currentStep.id, type: 'WAIT', seconds: 0 };
      } else {
        updated[index] = { id: currentStep.id, type: 'SEND_EMAIL', subject: '', body: '' };
      }
    } else {
      // For other keys, spread and update
      updated[index] = { ...currentStep, [key]: value };
    }
    
    setSteps(updated);
    onChange(updated);
  }

  function handleDeleteStep(index: number) {
    const updated = steps.filter((_, i) => i !== index);
    // Re-number steps to maintain sequential IDs
    const renumbered = updated.map((step, i) => ({
      ...step,
      id: i + 1,
    }));
    setSteps(renumbered);
    onChange(renumbered);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      // Re-number steps to maintain sequential IDs after reorder
      const renumbered = newSteps.map((step, i) => ({
        ...step,
        id: i + 1,
      }));
      setSteps(renumbered);
      onChange(renumbered);
    }
  }

  function addStep() {
    const newStepId = steps.length + 1;
    const newStep: CadenceStep = { id: newStepId, type: 'SEND_EMAIL', subject: '', body: '' };
    const updated = [...steps, newStep];
    setSteps(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      {/* Timeline header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700">Steps ({steps.length})</h3>
        <span className="text-xs text-gray-400">Drag to reorder</span>
      </div>
      
      {/* Timeline */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <SortableStep
                  key={step.id}
                  step={step}
                  index={idx}
                  onChange={(key, value) => handleStepChange(idx, key, value)}
                  onDelete={() => handleDeleteStep(idx)}
                />
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Add Step Button */}
      <button 
        onClick={addStep} 
        className="mt-4 flex items-center justify-center w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Step
      </button>
    </div>
  );
}

