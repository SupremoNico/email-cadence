import { Worker } from '@temporalio/worker';
import * as activities from './activities/email';

async function runWorker() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows/cadenceWorkflow'),
    activities,
    taskQueue: 'cadence-queue'
  });

  console.log('🟢 Temporal worker started on task queue: cadence-queue');
  await worker.run();
}

runWorker().catch((err) => {
  console.error('❌ Worker failed:', err);
  process.exit(1);
});
