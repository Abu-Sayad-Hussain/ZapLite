import { DataSource } from 'typeorm';
import { MockContact } from '../entities/MockContact';
import { ContactTag } from '../entities/ContactTag';
import { ContactNote } from '../entities/ContactNote';
import { EmailLog } from '../entities/EmailLog';
import { Notification } from '../entities/Notification';
import { Workflow } from '../entities/Workflow';
import { WorkflowRun } from '../entities/WorkflowRun';
import { Trigger } from '../entities/Trigger';
import { Action } from '../entities/Action';
import { ActionRun } from '../entities/ActionRun';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://postgres:password@localhost:5432/zaplite',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    MockContact,
    ContactTag,
    ContactNote,
    EmailLog,
    Notification,
    Workflow,
    WorkflowRun,
    Trigger,
    Action,
    ActionRun,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});