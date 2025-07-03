import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

import { AppDataSource } from './config/database';
import { WebSocketService } from './services/WebSocketService';
import { QueueService } from './services/QueueService';
import { ActionExecutorService } from './services/ActionExecutorService';
import { ActionHandlers } from './services/ActionHandlers';
import { WorkflowService } from './services/WorkflowService';
import { NotificationService } from './services/NotificationService';

import { WorkflowController } from './controllers/WorkflowController';
import { ContactController } from './controllers/ContactController';
import { QueueController } from './controllers/QueueController';

import { createWorkflowRoutes } from './routes/workflows';
import { createContactRoutes } from './routes/contacts';
import { createQueueRoutes } from './routes/queue';

import { errorHandler } from './middleware/errorHandler';
import { validateCreateWorkflow, validateCreateContact } from './middleware/validation';

async function startServer(): Promise<void> {
  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Create Express app
    const app = express();
    const httpServer = createServer(app);

    // Initialize services
    const webSocketService = new WebSocketService(httpServer);
    const notificationService = new NotificationService();
    const actionHandlers = new ActionHandlers();
    const actionExecutor = new ActionExecutorService(webSocketService, actionHandlers);
    const queueService = new QueueService(actionExecutor);
    const workflowService = new WorkflowService(
      queueService,
      webSocketService,
      notificationService
    );

    // Initialize controllers
    const workflowController = new WorkflowController(workflowService);
    const contactController = new ContactController(workflowService);
    const queueController = new QueueController(queueService);

    // Middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));
    app.use(morgan('combined'));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests, please try again later.',
      },
    });
    app.use('/api/', limiter);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'ZapLite Workflow Engine is running',
        timestamp: new Date().toISOString(),
        connectedClients: webSocketService.getConnectedClients(),
      });
    });

    // API routes
    app.use('/api/workflows', createWorkflowRoutes(workflowController));
    app.use('/api/mock-crm/contacts', createContactRoutes(contactController));
    app.use('/api/queue', createQueueRoutes(queueController));

    // API documentation
    app.get('/api', (req, res) => {
      res.json({
        success: true,
        message: 'ZapLite Workflow Automation Engine API',
        version: '1.0.0',
        endpoints: {
          workflows: {
            'POST /api/workflows': 'Create a new workflow',
            'GET /api/workflows': 'Get all workflows',
            'GET /api/workflows/:id': 'Get a specific workflow',
            'POST /api/workflows/:id/run': 'Manually trigger a workflow',
            'GET /api/workflows/runs': 'Get workflow execution runs',
          },
          contacts: {
            'POST /api/mock-crm/contacts': 'Create a new contact (triggers workflows)',
            'GET /api/mock-crm/contacts': 'Get all contacts',
            'GET /api/mock-crm/contacts/:id': 'Get a specific contact',
          },
          queue: {
            'GET /api/queue/stats': 'Get job queue statistics',
          },
          websocket: {
            events: [
              'workflow_started',
              'action_started',
              'action_success',
              'action_failed',
              'workflow_completed',
            ],
          },
        },
        sampleWorkflow: {
          name: 'New Contact Onboarding',
          description: 'Welcome new contacts with email and tag assignment',
          trigger: {
            type: 'new_contact_created',
          },
          actions: [
            {
              type: 'send_email',
              config: {
                subject: 'Welcome to RoBenDevs!',
                body: 'Hi {{contact.name}}, thank you for joining us.',
              },
            },
            {
              type: 'assign_tag',
              config: {
                tag: 'new-lead',
              },
            },
            {
              type: 'notify_team',
              config: {
                message: 'New contact onboarded: {{contact.email}}',
                webhookUrl: 'https://hooks.slack.com/services/...',
              },
            },
            {
              type: 'add_note',
              config: {
                note: 'Initial outreach initiated.',
              },
            },
          ],
        },
      });
    });

    // Error handling
    app.use(errorHandler);

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    });

    // Start server
    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
      console.log(`🚀 ZapLite Workflow Engine running on port ${port}`);
      console.log(`📡 WebSocket server ready for real-time updates`);
      console.log(`📚 API documentation available at http://localhost:${port}/api`);
      console.log(`🏥 Health check available at http://localhost:${port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      await queueService.close();
      await AppDataSource.destroy();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      await queueService.close();
      await AppDataSource.destroy();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();