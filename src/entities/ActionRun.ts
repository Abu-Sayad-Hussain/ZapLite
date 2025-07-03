import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowRun } from './WorkflowRun';
import { Action } from './Action';

export enum ActionRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('action_runs')
export class ActionRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowRunId: string;

  @Column({ type: 'uuid' })
  actionId: string;

  @Column({
    type: 'enum',
    enum: ActionRunStatus,
    default: ActionRunStatus.PENDING,
  })
  status: ActionRunStatus;

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => WorkflowRun, (workflowRun) => workflowRun.actionRuns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowRunId' })
  workflowRun: WorkflowRun;

  @ManyToOne(() => Action, (action) => action.actionRuns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actionId' })
  action: Action;
}