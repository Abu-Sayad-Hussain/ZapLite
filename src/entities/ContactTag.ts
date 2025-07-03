import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MockContact } from './MockContact';

@Entity('contact_tags')
export class ContactTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contactId: string;

  @Column({ type: 'varchar', length: 100 })
  tag: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => MockContact, (contact) => contact.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contactId' })
  contact: MockContact;
}