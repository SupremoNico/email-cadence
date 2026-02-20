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