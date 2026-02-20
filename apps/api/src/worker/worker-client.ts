import { WorkflowClient } from '@temporalio/client';
import type { CadenceStep } from '../types';
import type { WorkflowState } from '../types';

// Create a client using the default connection
const client = new WorkflowClient(); // ✅ No need for `new Connection()`

export async function startWorkflow(args: {
  workflowId: string;
  cadenceId: string;
  contactEmail: string;
  steps: CadenceStep[]
}) {
  return client.start('cadenceWorkflow', {
    workflowId: args.workflowId,
    taskQueue: 'cadence-queue',
    args: [{ contactEmail: args.contactEmail, steps: args.steps }],
  });
}

export async function signalWorkflow(workflowId: string, steps: CadenceStep[]) {
  const handle = client.getHandle(workflowId);
  return handle.signal('updateCadence', steps);
}

export async function queryWorkflow(workflowId: string): Promise<WorkflowState | null> {
  try {
    const handle = client.getHandle(workflowId);
    return await handle.query<WorkflowState>('getState');
  } catch (error) {
    console.error('Failed to query workflow:', error);
    return null;
  }
}
