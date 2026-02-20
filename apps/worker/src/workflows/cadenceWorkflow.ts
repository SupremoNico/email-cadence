import { proxyActivities, defineSignal, defineQuery, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from '../activities/email';

// Proxy activities
const { sendEmail, wait } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
});

// Add delay after sending emails (in seconds)
const EMAIL_DELAY_SECONDS = 3;

// Workflow types
export interface CadenceStep {
  id: number;
  type: 'SEND_EMAIL' | 'WAIT';
  subject?: string;
  body?: string;
  seconds?: number;
}

export interface WorkflowState {
  currentStepIndex: number;
  stepsVersion: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  steps: CadenceStep[];
  stepCompletionTimes: number[];
}

// ✅ Define signals & queries with name argument
export const updateCadenceSignal = defineSignal<[CadenceStep[]]>('updateCadence');
export const getStateQuery = defineQuery<WorkflowState>('getState');

export async function cadenceWorkflow(input: { steps: CadenceStep[]; contactEmail: string }) {
  let state: WorkflowState = {
    currentStepIndex: 0,
    stepsVersion: 1,
    status: input.steps.length === 0 ? 'COMPLETED' : 'PENDING',
    steps: input.steps ?? [],
    stepCompletionTimes: [],
  };

  // Attach signal handler inside workflow
  setHandler(updateCadenceSignal, (newSteps: CadenceStep[]) => {
    const oldIndex = state.currentStepIndex;
    state.steps = newSteps;
    state.stepsVersion += 1;

    if (newSteps.length <= oldIndex) {
      state.status = 'COMPLETED';
    } else if (state.status !== 'COMPLETED') {
      state.status = 'IN_PROGRESS';
    }
  });

  // Attach query handler inside workflow
  setHandler(getStateQuery, () => state);

  while (state.currentStepIndex < state.steps.length) {
    // Always use state.steps to get the latest steps (handles signal updates)
    const step = state.steps[state.currentStepIndex];
    state.status = 'IN_PROGRESS';

    if (step.type === 'WAIT' && step.seconds) {
      await sleep(step.seconds * 1000); // Temporal timer
      await wait(step.seconds); // mock log
    } else if (step.type === 'SEND_EMAIL' && step.subject && step.body) {
      await sendEmail(input.contactEmail, step.subject, step.body);
      // Add delay after sending email
      await sleep(EMAIL_DELAY_SECONDS * 1000);
    }

    // Record step completion time
    state.stepCompletionTimes.push(Date.now());

    state.currentStepIndex += 1;
    if (state.currentStepIndex >= state.steps.length) {
      state.status = 'COMPLETED';
    }
  }

  return state;
}
