import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { JobData } from '../types';
import { ActionExecutorService } from './ActionExecutorService';

export class QueueService {
  private actionQueue: Queue;
  private actionWorker: Worker;

  constructor(private actionExecutor: ActionExecutorService) {
    this.actionQueue = new Queue('actions', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.RETRY_DELAY_BASE || '1000'),
        },
      },
    });

    this.actionWorker = new Worker(
      'actions',
      async (job: Job<JobData>) => {
        return this.actionExecutor.executeAction(job.data);
      },
      {
        connection: redisConnection,
        concurrency: 10,
      }
    );

    this.setupWorkerEventHandlers();
  }

  private setupWorkerEventHandlers(): void {
    this.actionWorker.on('completed', (job) => {
      console.log(`✅ Action job ${job.id} completed successfully`);
    });

    this.actionWorker.on('failed', (job, err) => {
      console.error(`❌ Action job ${job?.id} failed:`, err.message);
    });

    this.actionWorker.on('error', (err) => {
      console.error('❌ Worker error:', err);
    });
  }

  async addActionJob(data: JobData): Promise<void> {
    await this.actionQueue.add('execute-action', data, {
      jobId: `${data.workflowRunId}-${data.actionId}`,
    });
  }

  async getQueueStats() {
    const waiting = await this.actionQueue.getWaiting();
    const active = await this.actionQueue.getActive();
    const completed = await this.actionQueue.getCompleted();
    const failed = await this.actionQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async close(): Promise<void> {
    await this.actionWorker.close();
    await this.actionQueue.close();
  }
}