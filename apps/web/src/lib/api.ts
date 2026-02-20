// apps/web/src/lib/api.ts
export const API_URL = 'http://localhost:3001';

export type CadenceStep =
  | { id: string; type: 'WAIT'; seconds: number }
  | { id: string; type: 'SEND_EMAIL'; subject: string; body: string };

export interface Cadence {
  id: string;
  name: string;
  steps: CadenceStep[];
}

export interface WorkflowState {
  currentStepIndex: number;
  stepsVersion: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  steps: CadenceStep[];
  stepCompletionTimes: number[];
}

export interface Enrollment {
  workflowId: string;
  cadenceId: string;
  contactEmail: string;
  state: WorkflowState;
}

// API Calls
export async function fetchCadences(): Promise<Cadence[]> {
  const res = await fetch(`${API_URL}/cadences`);
  if (!res.ok) throw new Error('Failed to fetch cadences');
  return res.json();
}

export async function fetchEnrollments(): Promise<Enrollment[]> {
  const res = await fetch(`${API_URL}/enrollments`);
  if (!res.ok) throw new Error('Failed to fetch enrollments');
  return res.json();
}

export async function startEnrollment(cadenceId: string, contactEmail: string): Promise<Enrollment> {
  const res = await fetch(`${API_URL}/enrollments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cadenceId, contactEmail }),
  });
  if (!res.ok) throw new Error('Failed to start enrollment');
  return res.json();
}

export async function fetchEnrollment(workflowId: string): Promise<Enrollment> {
  const res = await fetch(`${API_URL}/enrollments/${workflowId}`);
  if (!res.ok) throw new Error('Enrollment not found');
  return res.json();
}

export async function updateEnrollment(workflowId: string, steps: CadenceStep[]): Promise<Enrollment> {
  const res = await fetch(`${API_URL}/enrollments/${workflowId}/update-cadence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steps }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update enrollment');
  }
  return res.json();
}

export async function createCadence(name: string): Promise<Cadence> {
  const id = `cadence_${Date.now()}`;
  const res = await fetch(`${API_URL}/cadences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, steps: [] }),
  });
  if (!res.ok) throw new Error('Failed to create cadence');
  return res.json();
}

export async function updateCadence(cadenceId: string, steps: CadenceStep[], name?: string): Promise<Cadence> {
  const res = await fetch(`${API_URL}/cadences/${cadenceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steps, name }),
  });
  if (!res.ok) throw new Error('Failed to update cadence');
  return res.json();
}

export async function deleteCadence(cadenceId: string): Promise<void> {
  const res = await fetch(`${API_URL}/cadences/${cadenceId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete cadence');
}
