import { Request, Response, NextFunction } from 'express';

export function validateCreateWorkflow(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { name, trigger, actions } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Name is required and must be a string',
    });
    return;
  }

  if (!trigger || !trigger.type) {
    res.status(400).json({
      success: false,
      error: 'Trigger is required with a valid type',
    });
    return;
  }

  if (!actions || !Array.isArray(actions) || actions.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Actions array is required and must not be empty',
    });
    return;
  }

  const validTriggerTypes = ['new_contact_created', 'contact_tagged', 'manual_trigger'];
  if (!validTriggerTypes.includes(trigger.type)) {
    res.status(400).json({
      success: false,
      error: `Invalid trigger type. Must be one of: ${validTriggerTypes.join(', ')}`,
    });
    return;
  }

  const validActionTypes = ['send_email', 'assign_tag', 'notify_team', 'call_webhook', 'delay', 'add_note'];
  for (const action of actions) {
    if (!action.type || !validActionTypes.includes(action.type)) {
      res.status(400).json({
        success: false,
        error: `Invalid action type. Must be one of: ${validActionTypes.join(', ')}`,
      });
      return;
    }

    if (!action.config) {
      res.status(400).json({
        success: false,
        error: 'Action config is required',
      });
      return;
    }
  }

  next();
}

export function validateCreateContact(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { name, email } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Name is required and must be a string',
    });
    return;
  }

  if (!email || typeof email !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Email is required and must be a string',
    });
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'Invalid email format',
    });
    return;
  }

  next();
}