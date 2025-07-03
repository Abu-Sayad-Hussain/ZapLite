import { Router } from 'express';
import { ContactController } from '../controllers/ContactController';
import { validateCreateContact } from '../middleware/validation';

export function createContactRoutes(contactController: ContactController): Router {
  const router = Router();

  router.post('/', validateCreateContact, contactController.createContact);
  router.get('/', contactController.getContacts);
  router.get('/:id', contactController.getContact);

  return router;
}