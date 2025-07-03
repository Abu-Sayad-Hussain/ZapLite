import { Router } from 'express';
import { WorkflowController } from '../controllers/WorkflowController';
import { validateCreateWorkflow } from '../middleware/validation';

export function createWorkflowRoutes(workflowController: WorkflowController): Router {
  const router = Router();

  router.post('/', validateCreateWorkflow, workflowController.createWorkflow);
  router.get('/', workflowController.getWorkflows);
  router.get('/runs', workflowController.getWorkflowRuns);
  router.get('/:id', workflowController.getWorkflow);
  router.post('/:id/run', workflowController.manualTrigger);

  return router;
}