# ZapLite: Workflow Automation Engine

A powerful backend automation engine that lets users automate tasks by building workflows. Built with Node.js, TypeScript, Express.js, TypeORM, PostgreSQL, Redis, and BullMQ.

## Features

### Core Functionality
- **Workflow Management**: Create, retrieve, and manage automated workflows through REST APIs
- **Trigger System**: Support for multiple trigger types including new contact creation, contact tagging, and manual triggers
- **Asynchronous Processing**: All actions are executed asynchronously using Redis/BullMQ job queue with retry logic
- **Real-time Updates**: WebSocket support for live workflow execution monitoring
- **Built-in Actions**: Email sending, tag assignment, team notifications, webhook calls, delays, and note addition

### Built-in Actions
- `send_email`: Simulates sending emails by storing data in the database
- `assign_tag`: Assigns tags to contacts with duplicate prevention
- `notify_team`: Sends notifications to Slack webhooks
- `call_webhook`: Makes HTTP requests to external services
- `delay`: Pauses workflow execution for specified time
- `add_note`: Adds notes to contact records

### Technical Features
- **Docker Support**: Complete containerization with PostgreSQL and Redis
- **Template System**: Dynamic value substitution in action configurations
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Error Handling**: Comprehensive error logging and workflow failure management
- **Rate Limiting**: API protection against abuse
- **Health Monitoring**: Queue statistics and system health endpoints

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with TypeORM
- **Queue System**: Redis + BullMQ
- **Real-time**: Socket.IO
- **Containerization**: Docker & Docker Compose

## Quick Start

### Using Docker (Recommended)

1. **Clone and setup**:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

2. **Start services**:
   ```bash
   docker-compose up -d
   ```

3. **Verify installation**:
   ```bash
   curl http://localhost:3000/health
   ```

### Manual Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   # Configure DATABASE_URL and REDIS_URL
   ```

3. **Start services**:
   ```bash
   npm run dev
   ```

## API Documentation

### Workflows

#### Create Workflow
```bash
POST /api/workflows
Content-Type: application/json

{
  "name": "New Contact Onboarding",
  "description": "Welcome new contacts with email and tag assignment",
  "trigger": {
    "type": "new_contact_created"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "subject": "Welcome to RoBenDevs!",
        "body": "Hi {{contact.name}}, thank you for joining us."
      }
    },
    {
      "type": "assign_tag",
      "config": {
        "tag": "new-lead"
      }
    },
    {
      "type": "notify_team",
      "config": {
        "message": "New contact onboarded: {{contact.email}}",
        "webhookUrl": "https://hooks.slack.com/services/..."
      }
    }
  ]
}
```

#### Get Workflows
```bash
GET /api/workflows
```

#### Manual Trigger
```bash
POST /api/workflows/:id/run
Content-Type: application/json

{
  "contact": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Mock CRM

#### Create Contact (Triggers Workflows)
```bash
POST /api/mock-crm/contacts
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Tech Corp"
}
```

#### Get Contacts
```bash
GET /api/mock-crm/contacts
```

### Queue Management

#### Get Queue Statistics
```bash
GET /api/queue/stats
```

## WebSocket Events

Connect to the WebSocket server to receive real-time updates:

```javascript
const socket = io('http://localhost:3000');

// Listen for workflow events
socket.on('workflow_started', (event) => {
  console.log('Workflow started:', event.data);
});

socket.on('action_started', (event) => {
  console.log('Action started:', event.data);
});

socket.on('action_success', (event) => {
  console.log('Action completed:', event.data);
});

socket.on('action_failed', (event) => {
  console.log('Action failed:', event.data);
});

socket.on('workflow_completed', (event) => {
  console.log('Workflow completed:', event.data);
});
```

## Template System

Actions support dynamic value substitution using the `{{variable}}` syntax:

```json
{
  "type": "send_email",
  "config": {
    "subject": "Welcome {{contact.name}}!",
    "body": "Hi {{contact.name}}, your email is {{contact.email}}"
  }
}
```

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- `MAX_RETRY_ATTEMPTS`: Maximum retry attempts for failed actions (default: 3)
- `RETRY_DELAY_BASE`: Base delay for retry logic in milliseconds (default: 1000)
- `CORS_ORIGIN`: CORS origin configuration (default: *)

## Database Schema

The system manages two main data categories:

### CRM Data
- `mock_contacts`: Contact information
- `contact_tags`: Contact tags and labels
- `contact_notes`: Notes attached to contacts
- `email_logs`: Email sending logs
- `notifications`: Team notification logs

### Workflow Engine Data
- `workflows`: Workflow definitions
- `workflow_runs`: Workflow execution instances
- `triggers`: Trigger configurations
- `actions`: Workflow action steps
- `action_runs`: Action execution logs with retry information

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
```

### Building for Production
```bash
npm run build
npm start
```

## Architecture

The system follows a modular architecture with clear separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and orchestration
- **Entities**: Database models using TypeORM
- **Queue System**: Asynchronous job processing
- **WebSocket**: Real-time communication
- **Middleware**: Request validation and error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.