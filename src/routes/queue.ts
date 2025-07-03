import { Router } from 'express';
import { QueueController } from '../controllers/QueueController';

export function createQueueRoutes(queueController: QueueController): Router {
  const router = Router();

  router.get('/stats', queueController.getQueueStats);

  return router;
}