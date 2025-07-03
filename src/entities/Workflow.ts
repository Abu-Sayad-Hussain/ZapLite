import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { WorkflowRun } from './WorkflowRun';
import { Trigger } from './Trigger';
import { Action } from './Action';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Trigger, (trigger) => trigger.workflow)
  trigger: Trigger;

  @OneToMany(() => Action, (action) => action.workflow)
  actions: Action[];

  @OneToMany(() => WorkflowRun, (run) => run.workflow)
  runs: WorkflowRun[];
}