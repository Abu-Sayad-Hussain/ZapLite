import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ActionRun, ActionRunStatus } from '../entities/ActionRun';
import { Action, ActionType } from '../entities/Action';
import { WorkflowRun, WorkflowRunStatus } from '../entities/WorkflowRun';
import { JobData } from '../types';
import { WebSocketService } from './WebSocketService';
import { ActionHandlers } from './ActionHandlers';

export class ActionExecutorService {
  private actionRunRepository: Repository<ActionRun>;
  private actionRepository: Repository<Action>;
  private workflowRunRepository: Repository<WorkflowRun>;

  constructor(
    private webSocketService: WebSocketService,
    private actionHandlers: ActionHandlers
  ) {
    this.actionRunRepository = AppDataSource.getRepository(ActionRun);
    this.actionRepository = AppDataSource.getRepository(Action);
    this.workflowRunRepository = AppDataSource.getRepository(WorkflowRun);
  }

  async executeAction(jobData: JobData): Promise<void> {
    const { workflowRunId, actionId, triggerData } = jobData;

    // Get or create action run
    let actionRun = await this.actionRunRepository.findOne({
      where: { workflowRunId, actionId },
      relations: ['action'],
    });

    if (!actionRun) {
      const action = await this.actionRepository.findOne({ where: { id: actionId } });
      if (!action) {
        throw new Error(`Action not found: ${actionId}`);
      }

      actionRun = this.actionRunRepository.create({
        workflowRunId,
        actionId,
        status: ActionRunStatus.PENDING,
      });
      actionRun.action = action;
    }

    try {
      // Update status to running
      actionRun.status = ActionRunStatus.RUNNING;
      await this.actionRunRepository.save(actionRun);

      this.webSocketService.emit('action_started', {
        workflowRunId,
        actionId,
        actionType: actionRun.action.type,
        retryCount: actionRun.retryCount,
      });

      // Execute the action based on its type
      const result = await this.executeActionByType(
        actionRun.action.type,
        actionRun.action.config,
        triggerData
      );

      // Update action run with success
      actionRun.status = ActionRunStatus.SUCCESS;
      actionRun.result = result;
      await this.actionRunRepository.save(actionRun);

      this.webSocketService.emit('action_success', {
        workflowRunId,
        actionId,
        actionType: actionRun.action.type,
        result,
      });

      // Check if this was the last action in the workflow
      await this.checkWorkflowCompletion(workflowRunId);

    } catch (error) {
      // Increment retry count
      actionRun.retryCount += 1;
      actionRun.error = error instanceof Error ? error.message : String(error);

      const maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3');
      
      if (actionRun.retryCount >= maxRetries) {
        actionRun.status = ActionRunStatus.FAILED;
        await this.actionRunRepository.save(actionRun);

        this.webSocketService.emit('action_failed', {
          workflowRunId,
          actionId,
          actionType: actionRun.action.type,
          error: actionRun.error,
          retryCount: actionRun.retryCount,
        });

        // Mark workflow as failed
        await this.workflowRunRepository.update(workflowRunId, {
          status: WorkflowRunStatus.FAILED,
          error: `Action ${actionRun.action.type} failed after ${maxRetries} attempts: ${actionRun.error}`,
        });

        this.webSocketService.emit('workflow_completed', {
          workflowRunId,
          status: WorkflowRunStatus.FAILED,
          error: actionRun.error,
        });
      } else {
        actionRun.status = ActionRunStatus.RETRYING;
        await this.actionRunRepository.save(actionRun);
        throw error; // Let BullMQ handle the retry
      }
    }
  }

  private async executeActionByType(
    type: ActionType,
    config: any,
    triggerData: any
  ): Promise<any> {
    switch (type) {
      case ActionType.SEND_EMAIL:
        return this.actionHandlers.sendEmail(config, triggerData);
      case ActionType.ASSIGN_TAG:
        return this.actionHandlers.assignTag(config, triggerData);
      case ActionType.NOTIFY_TEAM:
        return this.actionHandlers.notifyTeam(config, triggerData);
      case ActionType.CALL_WEBHOOK:
        return this.actionHandlers.callWebhook(config, triggerData);
      case ActionType.DELAY:
        return this.actionHandlers.delay(config, triggerData);
      case ActionType.ADD_NOTE:
        return this.actionHandlers.addNote(config, triggerData);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  private async checkWorkflowCompletion(workflowRunId: string): Promise<void> {
    const workflowRun = await this.workflowRunRepository.findOne({
      where: { id: workflowRunId },
      relations: ['workflow', 'workflow.actions', 'actionRuns'],
    });

    if (!workflowRun) return;

    const totalActions = workflowRun.workflow.actions.length;
    const completedActions = workflowRun.actionRuns.filter(
      (run) => run.status === ActionRunStatus.SUCCESS
    ).length;

    if (completedActions === totalActions) {
      await this.workflowRunRepository.update(workflowRunId, {
        status: WorkflowRunStatus.COMPLETED,
      });

      this.webSocketService.emit('workflow_completed', {
        workflowRunId,
        status: WorkflowRunStatus.COMPLETED,
      });
    }
  }
}