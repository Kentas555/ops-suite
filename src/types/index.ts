// Bilingual content support
export interface BilingualText {
  lt: string;
  en: string;
}

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'blocked' | 'completed' | 'cancelled';
export type ClientStatus = 'active' | 'onboarding' | 'at_risk' | 'churned' | 'prospect' | 'paused' | 'issue';
export type ContractStatus = 'draft' | 'in_progress' | 'waiting_info' | 'review' | 'signed' | 'expired' | 'cancelled';
export type AccountStatus = 'pending_creation' | 'active' | 'suspended' | 'pending_closure' | 'closed';
export type OnboardingStage = 'initial_contact' | 'documents_collection' | 'contract_preparation' | 'account_setup' | 'system_configuration' | 'training' | 'go_live' | 'completed';
export type DocumentType = 'contract' | 'amendment' | 'invoice' | 'registration' | 'identification' | 'power_of_attorney' | 'other';
export type CommunicationType = 'email' | 'phone' | 'meeting' | 'internal_note';
export type KnowledgeCategory = 'process' | 'terminology' | 'checklist' | 'faq' | 'guideline' | 'template' | 'tip' | 'mistake_to_avoid';

// Ownership & visibility
export type Visibility = 'private' | 'team' | 'selected';

export interface VisibilityFields {
  ownerId: string;
  visibility: Visibility;
  sharedWith: string[]; // user IDs — only used when visibility = 'selected'
}

export interface Client extends VisibilityFields {
  id: string;
  companyName: string;
  phone: string;
  responsiblePerson: string;
  responsiblePersonRole?: string;
  status: ClientStatus;
  accountStatus: AccountStatus;
  contractStatus: ContractStatus;
  onboardingStage: OnboardingStage;
  createdAt: string;
  updatedAt: string;
  nextFollowUp?: string;
  lastInteractionAt?: string;
  nextAction?: string;
}

export interface Task extends VisibilityFields {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  clientId?: string;
  clientName?: string;
  category: string;
  dueDate?: string;
  dueTime?: string;
  createdAt: string;
  completedAt?: string;
  isRecurring: boolean;
  recurringInterval?: string;
  notes: string;
  checklistItems?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Contract extends VisibilityFields {
  id: string;
  clientId: string;
  clientName: string;
  contractNumber: string;
  type: string;
  status: ContractStatus;
  startDate?: string;
  endDate?: string;
  value?: number;
  currency: string;
  documents: Document[];
  notes: string;
  missingItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: 'received' | 'pending' | 'missing' | 'expired' | 'verified';
  uploadedAt?: string;
  expiresAt?: string;
  notes?: string;
}

export interface AccountWorkflow extends VisibilityFields {
  id: string;
  clientId: string;
  clientName: string;
  type: 'create' | 'update' | 'close';
  status: 'not_started' | 'in_progress' | 'waiting_approval' | 'completed' | 'failed';
  steps: WorkflowStep[];
  notes: string;
  createdAt: string;
  completedAt?: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  requiredFields?: string[];
  notes?: string;
  completedAt?: string;
}

export interface CommunicationLog {
  id: string;
  clientId: string;
  clientName: string;
  type: CommunicationType;
  subject: string;
  summary: string;
  nextAction?: string;
  createdAt: string;
  contactPerson?: string;
}

export interface KnowledgeEntry extends VisibilityFields {
  id: string;
  title: BilingualText;
  content: BilingualText;
  category: KnowledgeCategory;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuickNote {
  id: string;
  content: string;
  isPinned: boolean;
  color: string;
  createdAt: string;
}

export type QuickReplyCategory = 'pricing' | 'onboarding' | 'missing_info' | 'follow_up' | 'issues' | 'general';

export interface QuickReply {
  id: string;
  title: BilingualText;
  category: QuickReplyCategory;
  message: BilingualText;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface CommunicationTemplate {
  id: string;
  title: string;
  category: string;
  subject?: string;
  body: string;
  variables: string[];
}

export type GoalPeriod = 'month' | 'half_year' | 'year';
export type GoalStatus = 'in_progress' | 'completed' | 'partially_completed' | 'not_completed';

export interface Goal extends VisibilityFields {
  id: string;
  title: string;
  period: GoalPeriod;
  status: GoalStatus;
  reflection: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}
