import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  webhookUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  response: any;

  @Column({ type: 'varchar', length: 50, default: 'sent' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}