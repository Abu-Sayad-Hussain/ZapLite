import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MockContact } from './MockContact';

@Entity('contact_notes')
export class ContactNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contactId: string;

  @Column({ type: 'text' })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => MockContact, (contact) => contact.contactNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contactId' })
  contact: MockContact;
}