import axios from 'axios';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { TriggerType } from '../entities/Trigger';

export class NotificationService {
  private notificationRepository: Repository<Notification>;

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
  }

  async sendWorkflowNotification(
    workflowName: string,
    triggerType: TriggerType,
    triggerData: any
  ): Promise<void> {
    const message = `🚀 Workflow "${workflowName}" triggered by ${triggerType}`;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn('⚠️ SLACK_WEBHOOK_URL not configured, skipping notification');
      return;
    }

    try {
      const payload = {
        text: message,
        username: 'ZapLite Bot',
        icon_emoji: ':gear:',
        attachments: [
          {
            color: 'good',
            fields: [
              {
                title: 'Workflow',
                value: workflowName,
                short: true,
              },
              {
                title: 'Trigger Type',
                value: triggerType,
                short: true,
              },
              {
                title: 'Trigger Data',
                value: `\`\`\`${JSON.stringify(triggerData, null, 2)}\`\`\``,
                short: false,
              },
            ],
            timestamp: Math.floor(Date.now() / 1000),
          },
        ],
      };

      const response = await axios.post(webhookUrl, payload, {
        timeout: 5000,
      });

      // Store notification
      const notification = this.notificationRepository.create({
        message,
        webhookUrl,
        response: response.data,
        status: 'sent',
      });

      await this.notificationRepository.save(notification);
      console.log('✅ Workflow notification sent to Slack');

    } catch (error) {
      const notification = this.notificationRepository.create({
        message,
        webhookUrl,
        response: error instanceof Error ? error.message : String(error),
        status: 'failed',
      });

      await this.notificationRepository.save(notification);
      console.error('❌ Failed to send workflow notification:', error);
    }
  }
}