import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './Workflow';
import { ActionRun } from './ActionRun';

export enum ActionType {
  SEND_EMAIL = 'send_email',
  ASSIGN_TAG = 'assign_tag',
  NOTIFY_TEAM = 'notify_team',
  CALL_WEBHOOK = 'call_webhook',
  DELAY = 'delay',
  ADD_NOTE = 'add_note',
}

@Entity('actions')
export class Action {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  type: ActionType;

  @Column({ type: 'integer' })
  order: number;

  @Column({ type: 'jsonb' })
  config: any;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Workflow, (workflow) => workflow.actions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @OneToMany(() => ActionRun, (actionRun) => actionRun.action)
  actionRuns: ActionRun[];
}