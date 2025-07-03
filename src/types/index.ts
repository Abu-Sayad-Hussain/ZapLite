export interface CreateWorkflowDto {
  name: string;
  description?: string;
  trigger: {
    type: 'new_contact_created' | 'contact_tagged' | 'manual_trigger';
    config?: any;
  };
  actions: Array<{
    type: 'send_email' | 'assign_tag' | 'notify_team' | 'call_webhook' | 'delay' | 'add_note';
    config: any;
  }>;
}

export interface CreateContactDto {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export interface WebSocketEvent {
  type: 'workflow_started' | 'action_started' | 'action_success' | 'action_failed' | 'workflow_completed';
  data: any;
  timestamp: Date;
}

export interface JobData {
  workflowRunId: string;
  actionId: string;
  triggerData: any;
}