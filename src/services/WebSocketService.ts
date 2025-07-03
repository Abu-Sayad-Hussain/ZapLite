import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { WebSocketEvent } from '../types';

export class WebSocketService {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      socket.on('join_workflow', (workflowId: string) => {
        socket.join(`workflow_${workflowId}`);
        console.log(`📡 Client ${socket.id} joined workflow ${workflowId}`);
      });

      socket.on('leave_workflow', (workflowId: string) => {
        socket.leave(`workflow_${workflowId}`);
        console.log(`📡 Client ${socket.id} left workflow ${workflowId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  emit(eventType: WebSocketEvent['type'], data: any): void {
    const event: WebSocketEvent = {
      type: eventType,
      data,
      timestamp: new Date(),
    };

    // Emit to all connected clients
    this.io.emit(eventType, event);

    // If the event contains a workflowId, emit to that specific room
    if (data.workflowId) {
      this.io.to(`workflow_${data.workflowId}`).emit(eventType, event);
    }

    console.log(`📡 WebSocket event emitted: ${eventType}`, { data });
  }

  getConnectedClients(): number {
    return this.io.engine.clientsCount;
  }
}