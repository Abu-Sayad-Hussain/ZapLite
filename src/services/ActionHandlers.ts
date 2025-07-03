import { Repository } from 'typeorm';
import axios from 'axios';
import { AppDataSource } from '../config/database';
import { EmailLog } from '../entities/EmailLog';
import { ContactTag } from '../entities/ContactTag';
import { ContactNote } from '../entities/ContactNote';
import { Notification } from '../entities/Notification';
import nodemailer from 'nodemailer';


export class ActionHandlers {
  private emailLogRepository: Repository<EmailLog>;
  private contactTagRepository: Repository<ContactTag>;
  private contactNoteRepository: Repository<ContactNote>;
  private notificationRepository: Repository<Notification>;

  constructor() {
    this.emailLogRepository = AppDataSource.getRepository(EmailLog);
    this.contactTagRepository = AppDataSource.getRepository(ContactTag);
    this.contactNoteRepository = AppDataSource.getRepository(ContactNote);
    this.notificationRepository = AppDataSource.getRepository(Notification);
  }

  async sendEmail(config: any, triggerData: any): Promise<any> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // e.g. your-email@gmail.com
        pass: process.env.GMAIL_PASS  // App password, not your Gmail password!
      }
    });
    const { subject, body } = config;
    const contact = triggerData.contact;

    if (!contact || !contact.email) {
      throw new Error('Contact email not found in trigger data');
    }

    // Replace template variables
    const processedSubject = this.processTemplate(subject, { contact });
    const processedBody = this.processTemplate(body, { contact });

    // Store email log
    const emailLog = this.emailLogRepository.create({
      to: contact.email,
      subject: processedSubject,
      body: processedBody,
      status: 'sent',
    });

    await this.emailLogRepository.save(emailLog);

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: contact.email,
      subject: processedSubject,
      text: processedBody
    });

    return {
      to: contact.email,
      subject: processedSubject,
      body: processedBody,
      status: 'sent',
      timestamp: new Date(),
    };
  }

  async assignTag(config: any, triggerData: any): Promise<any> {
    const { tag } = config;
    const contact = triggerData.contact;

    if (!contact || !contact.id) {
      throw new Error('Contact not found in trigger data');
    }

    // Check if tag already exists
    const existingTag = await this.contactTagRepository.findOne({
      where: { contactId: contact.id, tag },
    });

    if (existingTag) {
      return { message: 'Tag already exists', tag };
    }

    // Create new tag
    const contactTag = this.contactTagRepository.create({
      contactId: contact.id,
      tag,
    });

    await this.contactTagRepository.save(contactTag);

    return {
      contactId: contact.id,
      tag,
      timestamp: new Date(),
    };
  }

  async notifyTeam(config: any, triggerData: any): Promise<any> {
    const { message, webhookUrl } = config;
    const processedMessage = this.processTemplate(message, triggerData);

    try {
      const response = await axios.post(
        webhookUrl || process.env.SLACK_WEBHOOK_URL || '',
        {
          text: processedMessage,
          username: 'ZapLite Bot',
          icon_emoji: ':robot_face:',
        },
        {
          timeout: 5000,
        }
      );

      // Store notification
      const notification = this.notificationRepository.create({
        message: processedMessage,
        webhookUrl: webhookUrl || process.env.SLACK_WEBHOOK_URL,
        response: response.data,
        status: 'sent',
      });

      await this.notificationRepository.save(notification);

      return {
        message: processedMessage,
        status: 'sent',
        timestamp: new Date(),
      };
    } catch (error) {
      const notification = this.notificationRepository.create({
        message: processedMessage,
        webhookUrl: webhookUrl || process.env.SLACK_WEBHOOK_URL,
        response: error instanceof Error ? error.message : String(error),
        status: 'failed',
      });

      await this.notificationRepository.save(notification);
      throw error;
    }
  }

  async callWebhook(config: any, triggerData: any): Promise<any> {
    const { url, method = 'POST', headers = {}, body } = config;

    try {
      const processedBody = body ? this.processTemplate(JSON.stringify(body), triggerData) : undefined;

      const response = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        data: processedBody ? JSON.parse(processedBody) : undefined,
        timeout: 10000,
      });

      return {
        url,
        method,
        status: response.status,
        response: response.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Webhook call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delay(config: any, triggerData: any): Promise<any> {
    const { seconds } = config;
    const delayMs = (seconds || 1) * 1000;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
      delaySeconds: seconds,
      timestamp: new Date(),
    };
  }

  async addNote(config: any, triggerData: any): Promise<any> {
    const { note } = config;
    const contact = triggerData.contact;

    if (!contact || !contact.id) {
      throw new Error('Contact not found in trigger data');
    }

    const processedNote = this.processTemplate(note, { contact });

    const contactNote = this.contactNoteRepository.create({
      contactId: contact.id,
      note: processedNote,
    });

    await this.contactNoteRepository.save(contactNote);

    return {
      contactId: contact.id,
      note: processedNote,
      timestamp: new Date(),
    };
  }

  private processTemplate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
      
      return value !== undefined ? String(value) : match;
    });
  }
}