import { Request, Response } from 'express';
import { QueueService } from '../services/QueueService';

export class QueueController {
  constructor(private queueService: QueueService) {}

  getQueueStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.queueService.getQueueStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}