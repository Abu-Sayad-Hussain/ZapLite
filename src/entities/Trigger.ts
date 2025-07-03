import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './Workflow';

export enum TriggerType {
  NEW_CONTACT_CREATED = 'new_contact_created',
  CONTACT_TAGGED = 'contact_tagged',
  MANUAL_TRIGGER = 'manual_trigger',
}

@Entity('triggers')
export class Trigger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @Column({
    type: 'enum',
    enum: TriggerType,
  })
  type: TriggerType;

  @Column({ type: 'jsonb', nullable: true })
  config: any;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Workflow, (workflow) => workflow.trigger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;
}