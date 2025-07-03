import { Request, Response } from 'express';
import { WorkflowService } from '../services/WorkflowService';
import { CreateWorkflowDto } from '../types';
import { TriggerType } from '../entities/Trigger';

export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  createWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateWorkflowDto = req.body;
      const workflow = await this.workflowService.createWorkflow(dto);
      res.status(201).json({
        success: true,
        data: workflow,
        message: 'Workflow created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getWorkflows = async (req: Request, res: Response): Promise<void> => {
    try {
      const workflows = await this.workflowService.getWorkflows();
      
      res.json({
        success: true,
        data: workflows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workflow = await this.workflowService.getWorkflow(id);
      
      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
        return;
      }

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  manualTrigger = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const triggerData = req.body || {};

      const workflowRun = await this.workflowService.manualTrigger(id, triggerData);
      res.json({
        success: true,
        data: workflowRun,
        message: 'Workflow triggered successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getWorkflowRuns = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.query;
      const runs = await this.workflowService.getWorkflowRuns(workflowId as string);
      res.json({
        success: true,
        data: runs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}