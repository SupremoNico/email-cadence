import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentCadenceDto } from './dto/update-cadence.dto';
import { startWorkflow, signalWorkflow, queryWorkflow } from '../worker/worker-client';
import { Enrollment, WorkflowState } from '../types';
import { CadencesService } from '../cadences/cadences.service';

@Injectable()
export class EnrollmentsService {
  private enrollments: Record<string, Enrollment> = {};

  constructor(private readonly cadencesService: CadencesService) {}

  async list(): Promise<Enrollment[]> {
    const enrollments = Object.values(this.enrollments);
    // Refresh state from workflow for each enrollment
    const updatedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const workflowState = await queryWorkflow(enrollment.workflowId);
        if (workflowState) {
          return {
            ...enrollment,
            state: {
              ...enrollment.state,
              ...workflowState,
              steps: workflowState.steps.length > 0 ? workflowState.steps : enrollment.state.steps,
              stepCompletionTimes: workflowState.stepCompletionTimes?.length > 0 
                ? workflowState.stepCompletionTimes 
                : enrollment.state.stepCompletionTimes,
            },
          };
        }
        return enrollment;
      })
    );
    // Sort by workflowId descending (newest first) - workflowId is "enroll_${timestamp}"
    return updatedEnrollments.sort((a, b) => {
      const timestampA = parseInt(a.workflowId.replace('enroll_', ''), 10);
      const timestampB = parseInt(b.workflowId.replace('enroll_', ''), 10);
      return timestampB - timestampA;
    });
  }

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const workflowId = `enroll_${Date.now()}`;

    // Fetch cadence from backend to get steps
    const cadence = this.cadencesService.get(dto.cadenceId);
    const steps = cadence?.steps ?? [];

    const state: WorkflowState = {
      currentStepIndex: 0,
      stepsVersion: 1,
      status: steps.length === 0 ? 'COMPLETED' : 'PENDING',
      steps,
      stepCompletionTimes: [],
    };

    const enrollment: Enrollment = {
      workflowId,
      cadenceId: dto.cadenceId,
      contactEmail: dto.contactEmail,
      state,
    };

    this.enrollments[workflowId] = enrollment;

    await startWorkflow({
      workflowId,
      cadenceId: dto.cadenceId,
      contactEmail: dto.contactEmail,
      steps,
    });

    return enrollment;
  }

  async get(workflowId: string): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments[workflowId];
    if (!enrollment) return undefined;

    // Query the workflow for real-time state from Temporal
    const workflowState = await queryWorkflow(workflowId);
    
    if (workflowState) {
      // Merge the workflow state with local enrollment
      // Use workflow state's currentStepIndex and status
      return {
        ...enrollment,
        state: {
          ...enrollment.state,
          ...workflowState,
          // Keep local steps if workflow state doesn't have them yet
          steps: workflowState.steps.length > 0 ? workflowState.steps : enrollment.state.steps,
          // Keep stepCompletionTimes from workflow if available
          stepCompletionTimes: workflowState.stepCompletionTimes?.length > 0 
            ? workflowState.stepCompletionTimes 
            : enrollment.state.stepCompletionTimes,
        },
      };
    }

    return enrollment;
  }

  async updateCadence(workflowId: string, dto: UpdateEnrollmentCadenceDto): Promise<Enrollment | null> {
    const enrollment = this.enrollments[workflowId];
    if (!enrollment) return null;

    // Check if the workflow is already completed
    if (enrollment.state.status === 'COMPLETED') {
      throw new BadRequestException('Cannot update a completed workflow');
    }

    const currentIndex = enrollment.state.currentStepIndex;
    enrollment.state.steps = dto.steps;
    enrollment.state.stepsVersion += 1;

    if (dto.steps.length <= currentIndex) {
      enrollment.state.status = 'COMPLETED';
    } else {
      enrollment.state.status = 'IN_PROGRESS';
    }

    await signalWorkflow(workflowId, dto.steps);

    return enrollment;
  }
}
