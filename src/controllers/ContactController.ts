import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { MockContact } from '../entities/MockContact';
import { WorkflowService } from '../services/WorkflowService';
import { TriggerType } from '../entities/Trigger';
import { CreateContactDto } from '../types';

export class ContactController {
  private mockContactRepository: Repository<MockContact>;

  constructor(private workflowService: WorkflowService) {
    this.mockContactRepository = AppDataSource.getRepository(MockContact);
  }

  createContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateContactDto = req.body;
      
      // Check if contact already exists
      const existingContact = await this.mockContactRepository.findOne({
        where: { email: dto.email },
      });

      if (existingContact) {
        res.status(409).json({
          success: false,
          error: 'Contact with this email already exists',
        });
        return;
      }

      // Create contact
      const contact = this.mockContactRepository.create(dto);
      await this.mockContactRepository.save(contact);

      // Trigger workflows
      await this.workflowService.triggerWorkflow(TriggerType.NEW_CONTACT_CREATED, {
        contact,
      });

      res.status(201).json({
        success: true,
        data: contact,
        message: 'Contact created successfully and workflows triggered',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getContacts = async (req: Request, res: Response): Promise<void> => {
    try {
      const contacts = await this.mockContactRepository.find({
        relations: ['tags', 'contactNotes'],
        order: { createdAt: 'DESC' },
      });

      res.json({
        success: true,
        data: contacts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const contact = await this.mockContactRepository.findOne({
        where: { id },
        relations: ['tags', 'contactNotes'],
      });

      if (!contact) {
        res.status(404).json({
          success: false,
          error: 'Contact not found',
        });
        return;
      }

      res.json({
        success: true,
        data: contact,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}