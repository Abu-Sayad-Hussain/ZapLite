import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Workflow } from "../entities/Workflow";
import { WorkflowRun, WorkflowRunStatus } from "../entities/WorkflowRun";
import { Trigger, TriggerType } from "../entities/Trigger";
import { Action } from "../entities/Action";
import { CreateWorkflowDto } from "../types";
import { QueueService } from "./QueueService";
import { WebSocketService } from "./WebSocketService";
import { NotificationService } from "./NotificationService";

export class WorkflowService {
  private workflowRepository: Repository<Workflow>;
  private workflowRunRepository: Repository<WorkflowRun>;

  constructor(
    private queueService: QueueService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService
  ) {
    this.workflowRepository = AppDataSource.getRepository(Workflow);
    this.workflowRunRepository = AppDataSource.getRepository(WorkflowRun);
  }

  async createWorkflow(dto: CreateWorkflowDto): Promise<Workflow> {
    return AppDataSource.transaction(async (manager) => {
      // Create workflow
      const workflow = manager.create(Workflow, {
        name: dto.name,
        description: dto.description,
      });
      await manager.save(workflow);

      // Create trigger
      const trigger = manager.create(Trigger, {
        workflowId: workflow.id,
        type: dto.trigger.type as TriggerType,
        config: dto.trigger.config || {},
      });
      await manager.save(trigger);

      // Create actions
      const actions = dto.actions.map((actionDto, index) =>
        manager.create(Action, {
          workflowId: workflow.id,
          type: actionDto.type as any,
          order: index + 1,
          config: actionDto.config,
        })
      );
      await manager.save(actions);

      return workflow;
    });
  }

  async getWorkflows(): Promise<Workflow[]> {
    return this.workflowRepository.find({
      relations: ["trigger", "actions"],
      order: { createdAt: "DESC" },
    });
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.workflowRepository.findOne({
      where: { id },
      relations: ["trigger", "actions", "runs"],
    });
  }

  async triggerWorkflow(
    triggerType: TriggerType,
    triggerData: any
  ): Promise<void> {
    const workflows = await this.workflowRepository.find({
      where: { isActive: true },
      relations: ["trigger", "actions"],
    });

    const matchingWorkflows = workflows.filter(
      (workflow) => workflow.trigger.type === triggerType
    );

    for (const workflow of matchingWorkflows) {
      await this.executeWorkflow(workflow, triggerData);
    }
  }

  async executeWorkflow(
    workflow: Workflow,
    triggerData: any
  ): Promise<WorkflowRun> {
    // Create workflow run
    const workflowRun = this.workflowRunRepository.create({
      workflowId: workflow.id,
      status: WorkflowRunStatus.RUNNING,
      triggerData,
    });
    await this.workflowRunRepository.save(workflowRun);

    // Emit workflow started event
    this.webSocketService.emit("workflow_started", {
      workflowRunId: workflowRun.id,
      workflowName: workflow.name,
      triggerData,
    });

    // Send Slack notification
    await this.notificationService.sendWorkflowNotification(
      workflow.name,
      workflow.trigger.type,
      triggerData
    );

    // Queue actions for execution
    const sortedActions = workflow.actions.sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      await this.queueService.addActionJob({
        workflowRunId: workflowRun.id,
        actionId: action.id,
        triggerData,
      });
    }

    return workflowRun;
  }

  async manualTrigger(
    workflowId: string,
    triggerData: any = {}
  ): Promise<WorkflowRun> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.isActive) {
      throw new Error("Workflow is not active");
    }

    return this.executeWorkflow(workflow, triggerData);
  }

  async updateWorkflowRunStatus(
    workflowRunId: string,
    status: WorkflowRunStatus,
    error?: string
  ): Promise<void> {
    await this.workflowRunRepository.update(workflowRunId, {
      status,
      error,
      updatedAt: new Date(),
    });

    if (
      status === WorkflowRunStatus.COMPLETED ||
      status === WorkflowRunStatus.FAILED
    ) {
      this.webSocketService.emit("workflow_completed", {
        workflowRunId,
        status,
        error,
      });
    }
  }

  async getWorkflowRuns(workflowId?: string): Promise<WorkflowRun[]> {
    const whereCondition = workflowId ? { workflowId } : {};

    return this.workflowRunRepository.find({
      where: whereCondition,
      relations: ["workflow", "actionRuns", "actionRuns.action"],
      order: { createdAt: "DESC" },
    });
  }
}
