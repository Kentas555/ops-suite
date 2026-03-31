import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type {
  Client, Task, Contract, AccountWorkflow, CommunicationLog,
  KnowledgeEntry, SOPChecklist, QuickNote, CommunicationTemplate,
  WorkflowStep, QuickReply, Goal,
} from '../types';
import type { Language } from '../i18n/translations';

// ─── Mappers: DB row (snake_case) → TypeScript (camelCase) ───────

function mapVisibility(r: Record<string, unknown>) {
  return {
    ownerId: (r.owner_id as string) || '',
    visibility: ((r.visibility as string) || 'team') as import('../types').Visibility,
    sharedWith: (r.shared_with as string[]) || [],
  };
}

function visibilityToDb(v: { ownerId?: string; visibility?: string; sharedWith?: string[] }) {
  const d: Record<string, unknown> = {};
  if (v.ownerId !== undefined) d.owner_id = v.ownerId;
  if (v.visibility !== undefined) d.visibility = v.visibility;
  if (v.sharedWith !== undefined) d.shared_with = v.sharedWith;
  return d;
}

async function getOwnerId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? '';
}

function mapClient(r: Record<string, unknown>): Client {
  return {
    ...mapVisibility(r),
    id: r.id as string,
    companyName: (r.company_name as string) || '',
    phone: (r.phone as string) || '',
    responsiblePerson: (r.responsible_person as string) || '',
    responsiblePersonRole: r.responsible_person_role as string | undefined,
    status: r.status as Client['status'],
    accountStatus: r.account_status as Client['accountStatus'],
    contractStatus: r.contract_status as Client['contractStatus'],
    onboardingStage: r.onboarding_stage as Client['onboardingStage'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    nextFollowUp: r.next_follow_up as string | undefined,
    lastInteractionAt: r.last_interaction_at as string | undefined,
    nextAction: r.next_action as string | undefined,
  };
}

function clientToDb(c: Partial<Client>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...visibilityToDb(c) };
  if (c.id !== undefined) d.id = c.id;
  if (c.companyName !== undefined) d.company_name = c.companyName;
  if (c.phone !== undefined) d.phone = c.phone;
  if (c.responsiblePerson !== undefined) d.responsible_person = c.responsiblePerson;
  if (c.responsiblePersonRole !== undefined) d.responsible_person_role = c.responsiblePersonRole;
  if (c.status !== undefined) d.status = c.status;
  if (c.accountStatus !== undefined) d.account_status = c.accountStatus;
  if (c.contractStatus !== undefined) d.contract_status = c.contractStatus;
  if (c.onboardingStage !== undefined) d.onboarding_stage = c.onboardingStage;
  if (c.nextFollowUp !== undefined) d.next_follow_up = c.nextFollowUp;
  if (c.lastInteractionAt !== undefined) d.last_interaction_at = c.lastInteractionAt;
  if (c.nextAction !== undefined) d.next_action = c.nextAction;
  if (c.updatedAt !== undefined) d.updated_at = c.updatedAt;
  return d;
}

function mapTask(r: Record<string, unknown>): Task {
  return {
    ...mapVisibility(r),
    id: r.id as string,
    title: (r.title as string) || '',
    description: (r.description as string) || '',
    status: r.status as Task['status'],
    priority: r.priority as Task['priority'],
    clientId: r.client_id as string | undefined,
    clientName: r.client_name as string | undefined,
    category: (r.category as string) || '',
    dueDate: r.due_date as string | undefined,
    dueTime: r.due_time as string | undefined,
    createdAt: r.created_at as string,
    completedAt: r.completed_at as string | undefined,
    isRecurring: r.is_recurring as boolean,
    recurringInterval: r.recurring_interval as string | undefined,
    notes: (r.notes as string) || '',
    checklistItems: (r.checklist_items as Task['checklistItems']) || [],
  };
}

function taskToDb(t: Partial<Task>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...visibilityToDb(t) };
  if (t.id !== undefined) d.id = t.id;
  if (t.title !== undefined) d.title = t.title;
  if (t.description !== undefined) d.description = t.description;
  if (t.status !== undefined) d.status = t.status;
  if (t.priority !== undefined) d.priority = t.priority;
  if (t.clientId !== undefined) d.client_id = t.clientId;
  if (t.clientName !== undefined) d.client_name = t.clientName;
  if (t.category !== undefined) d.category = t.category;
  if (t.dueDate !== undefined) d.due_date = t.dueDate || null;
  if (t.dueTime !== undefined) d.due_time = t.dueTime;
  if (t.completedAt !== undefined) d.completed_at = t.completedAt;
  if (t.isRecurring !== undefined) d.is_recurring = t.isRecurring;
  if (t.recurringInterval !== undefined) d.recurring_interval = t.recurringInterval;
  if (t.notes !== undefined) d.notes = t.notes;
  if (t.checklistItems !== undefined) d.checklist_items = t.checklistItems;
  return d;
}

function mapContract(r: Record<string, unknown>): Contract {
  return {
    ...mapVisibility(r),
    id: r.id as string,
    clientId: r.client_id as string,
    clientName: (r.client_name as string) || '',
    contractNumber: (r.contract_number as string) || '',
    type: (r.type as string) || '',
    status: r.status as Contract['status'],
    startDate: r.start_date as string | undefined,
    endDate: r.end_date as string | undefined,
    value: r.value as number | undefined,
    currency: (r.currency as string) || 'EUR',
    documents: (r.documents as Contract['documents']) || [],
    notes: (r.notes as string) || '',
    missingItems: (r.missing_items as string[]) || [],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function contractToDb(c: Partial<Contract>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...visibilityToDb(c) };
  if (c.id !== undefined) d.id = c.id;
  if (c.clientId !== undefined) d.client_id = c.clientId;
  if (c.clientName !== undefined) d.client_name = c.clientName;
  if (c.contractNumber !== undefined) d.contract_number = c.contractNumber;
  if (c.type !== undefined) d.type = c.type;
  if (c.status !== undefined) d.status = c.status;
  if (c.startDate !== undefined) d.start_date = c.startDate || null;
  if (c.endDate !== undefined) d.end_date = c.endDate || null;
  if (c.value !== undefined) d.value = c.value;
  if (c.currency !== undefined) d.currency = c.currency;
  if (c.documents !== undefined) d.documents = c.documents;
  if (c.notes !== undefined) d.notes = c.notes;
  if (c.missingItems !== undefined) d.missing_items = c.missingItems;
  if (c.updatedAt !== undefined) d.updated_at = c.updatedAt;
  return d;
}

function mapWorkflow(r: Record<string, unknown>): AccountWorkflow {
  return {
    ...mapVisibility(r),
    id: r.id as string,
    clientId: r.client_id as string,
    clientName: (r.client_name as string) || '',
    type: r.type as AccountWorkflow['type'],
    status: r.status as AccountWorkflow['status'],
    steps: (r.steps as WorkflowStep[]) || [],
    notes: (r.notes as string) || '',
    createdAt: r.created_at as string,
    completedAt: r.completed_at as string | undefined,
  };
}

function workflowToDb(w: Partial<AccountWorkflow>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...visibilityToDb(w) };
  if (w.id !== undefined) d.id = w.id;
  if (w.clientId !== undefined) d.client_id = w.clientId;
  if (w.clientName !== undefined) d.client_name = w.clientName;
  if (w.type !== undefined) d.type = w.type;
  if (w.status !== undefined) d.status = w.status;
  if (w.steps !== undefined) d.steps = w.steps;
  if (w.notes !== undefined) d.notes = w.notes;
  if (w.completedAt !== undefined) d.completed_at = w.completedAt;
  return d;
}

function mapCommLog(r: Record<string, unknown>): CommunicationLog {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    clientName: (r.client_name as string) || '',
    type: r.type as CommunicationLog['type'],
    subject: (r.subject as string) || '',
    summary: (r.summary as string) || '',
    nextAction: r.next_action as string | undefined,
    createdAt: r.created_at as string,
    contactPerson: r.contact_person as string | undefined,
  };
}

function commLogToDb(l: Partial<CommunicationLog>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (l.id !== undefined) d.id = l.id;
  if (l.clientId !== undefined) d.client_id = l.clientId;
  if (l.clientName !== undefined) d.client_name = l.clientName;
  if (l.type !== undefined) d.type = l.type;
  if (l.subject !== undefined) d.subject = l.subject;
  if (l.summary !== undefined) d.summary = l.summary;
  if (l.nextAction !== undefined) d.next_action = l.nextAction;
  if (l.contactPerson !== undefined) d.contact_person = l.contactPerson;
  return d;
}

function mapKnowledge(r: Record<string, unknown>): KnowledgeEntry {
  return {
    ...mapVisibility(r),
    id: r.id as string,
    title: r.title as KnowledgeEntry['title'],
    content: r.content as KnowledgeEntry['content'],
    category: r.category as KnowledgeEntry['category'],
    tags: (r.tags as string[]) || [],
    isPinned: r.is_pinned as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function knowledgeToDb(e: Partial<KnowledgeEntry>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...visibilityToDb(e) };
  if (e.id !== undefined) d.id = e.id;
  if (e.title !== undefined) d.title = e.title;
  if (e.content !== undefined) d.content = e.content;
  if (e.category !== undefined) d.category = e.category;
  if (e.tags !== undefined) d.tags = e.tags;
  if (e.isPinned !== undefined) d.is_pinned = e.isPinned;
  if (e.updatedAt !== undefined) d.updated_at = e.updatedAt;
  return d;
}

function mapSOP(r: Record<string, unknown>): SOPChecklist {
  return {
    ...mapVisibility(r),
    id: r.id as string,
    title: (r.title as string) || '',
    description: (r.description as string) || '',
    category: (r.category as string) || '',
    items: (r.items as SOPChecklist['items']) || [],
    estimatedTime: r.estimated_time as string | undefined,
    lastUsed: r.last_used as string | undefined,
    usageCount: (r.usage_count as number) || 0,
  };
}

function sopToDb(c: Partial<SOPChecklist>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...visibilityToDb(c) };
  if (c.id !== undefined) d.id = c.id;
  if (c.title !== undefined) d.title = c.title;
  if (c.description !== undefined) d.description = c.description;
  if (c.category !== undefined) d.category = c.category;
  if (c.items !== undefined) d.items = c.items;
  if (c.estimatedTime !== undefined) d.estimated_time = c.estimatedTime;
  if (c.lastUsed !== undefined) d.last_used = c.lastUsed;
  if (c.usageCount !== undefined) d.usage_count = c.usageCount;
  return d;
}

function mapQuickNote(r: Record<string, unknown>): QuickNote {
  return {
    id: r.id as string,
    content: (r.content as string) || '',
    isPinned: r.is_pinned as boolean,
    color: (r.color as string) || 'yellow',
    createdAt: r.created_at as string,
  };
}

function quickNoteToDb(n: Partial<QuickNote>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (n.id !== undefined) d.id = n.id;
  if (n.content !== undefined) d.content = n.content;
  if (n.isPinned !== undefined) d.is_pinned = n.isPinned;
  if (n.color !== undefined) d.color = n.color;
  return d;
}

function mapTemplate(r: Record<string, unknown>): CommunicationTemplate {
  return {
    id: r.id as string,
    title: (r.title as string) || '',
    category: (r.category as string) || '',
    subject: r.subject as string | undefined,
    body: (r.body as string) || '',
    variables: (r.variables as string[]) || [],
  };
}

function mapQuickReply(r: Record<string, unknown>): QuickReply {
  return {
    id: r.id as string,
    title: r.title as QuickReply['title'],
    category: r.category as QuickReply['category'],
    message: r.message as QuickReply['message'],
    usageCount: (r.usage_count as number) || 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function quickReplyToDb(r: Partial<QuickReply>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (r.id !== undefined) d.id = r.id;
  if (r.title !== undefined) d.title = r.title;
  if (r.category !== undefined) d.category = r.category;
  if (r.message !== undefined) d.message = r.message;
  if (r.usageCount !== undefined) d.usage_count = r.usageCount;
  if (r.updatedAt !== undefined) d.updated_at = r.updatedAt;
  return d;
}

function mapGoal(r: Record<string, unknown>): Goal {
  return {
    ...mapVisibility(r),
    id: r.id as string,
    title: (r.title as string) || '',
    period: r.period as Goal['period'],
    status: r.status as Goal['status'],
    reflection: (r.reflection as string) || '',
    userId: r.user_id as string,
    userName: (r.user_name as string) || '',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function goalToDb(g: Partial<Goal>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...visibilityToDb(g) };
  if (g.id !== undefined) d.id = g.id;
  if (g.title !== undefined) d.title = g.title;
  if (g.period !== undefined) d.period = g.period;
  if (g.status !== undefined) d.status = g.status;
  if (g.reflection !== undefined) d.reflection = g.reflection;
  if (g.userId !== undefined) d.user_id = g.userId;
  if (g.userName !== undefined) d.user_name = g.userName;
  if (g.updatedAt !== undefined) d.updated_at = g.updatedAt;
  return d;
}

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

// ─── Store Interface ─────────────────────────────────────────────

interface AppState {
  // ── Supabase data ──
  clients: Client[];
  tasks: Task[];
  contracts: Contract[];
  accountWorkflows: AccountWorkflow[];
  communicationLogs: CommunicationLog[];
  knowledgeEntries: KnowledgeEntry[];
  sopChecklists: SOPChecklist[];
  quickNotes: QuickNote[];
  communicationTemplates: CommunicationTemplate[];
  quickReplies: QuickReply[];
  goals: Goal[];
  initialized: boolean;

  fetchAll: () => Promise<void>;

  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'ownerId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskChecklistItem: (taskId: string, itemId: string) => Promise<void>;

  // Contracts
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<void>;
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;

  // Account Workflows
  addAccountWorkflow: (workflow: Omit<AccountWorkflow, 'id' | 'createdAt' | 'ownerId'>) => Promise<void>;
  updateAccountWorkflow: (id: string, updates: Partial<AccountWorkflow>) => Promise<void>;
  updateWorkflowStep: (workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => Promise<void>;

  // Communication Logs
  addCommunicationLog: (log: Omit<CommunicationLog, 'id' | 'createdAt'>) => Promise<void>;
  addInteraction: (clientId: string, log: Omit<CommunicationLog, 'id' | 'createdAt'>) => Promise<void>;

  // Knowledge
  addKnowledgeEntry: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<void>;
  updateKnowledgeEntry: (id: string, updates: Partial<KnowledgeEntry>) => Promise<void>;
  deleteKnowledgeEntry: (id: string) => Promise<void>;

  // SOP Checklists
  addSOPChecklist: (checklist: Omit<SOPChecklist, 'id' | 'ownerId'>) => Promise<void>;
  updateSOPChecklist: (id: string, updates: Partial<SOPChecklist>) => Promise<void>;

  // Quick Notes
  addQuickNote: (note: Omit<QuickNote, 'id' | 'createdAt'>) => Promise<void>;
  updateQuickNote: (id: string, updates: Partial<QuickNote>) => Promise<void>;
  deleteQuickNote: (id: string) => Promise<void>;

  // Communication Templates
  addCommunicationTemplate: (template: Omit<CommunicationTemplate, 'id'>) => Promise<void>;
  updateCommunicationTemplate: (id: string, updates: Partial<CommunicationTemplate>) => Promise<void>;
  deleteCommunicationTemplate: (id: string) => Promise<void>;

  // Quick Replies
  addQuickReply: (reply: Omit<QuickReply, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
  updateQuickReply: (id: string, updates: Partial<QuickReply>) => Promise<void>;
  deleteQuickReply: (id: string) => Promise<void>;
  incrementQuickReplyUsage: (id: string) => Promise<void>;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // ── UI preferences (persisted to localStorage) ──
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeChecklistProgress: Record<string, Record<string, boolean>>;
  toggleChecklistProgress: (checklistId: string, itemId: string) => void;
  resetChecklistProgress: (checklistId: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

// ─── Store ───────────────────────────────────────────────────────

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      clients: [],
      tasks: [],
      contracts: [],
      accountWorkflows: [],
      communicationLogs: [],
      knowledgeEntries: [],
      sopChecklists: [],
      quickNotes: [],
      communicationTemplates: [],
      quickReplies: [],
      goals: [],
      initialized: false,

      // ── Fetch all data from Supabase on login ──
      fetchAll: async () => {
        const [
          { data: clients },
          { data: tasks },
          { data: contracts },
          { data: accountWorkflows },
          { data: communicationLogs },
          { data: knowledgeEntries },
          { data: sopChecklists },
          { data: quickNotes },
          { data: communicationTemplates },
          { data: quickReplies },
          { data: goals },
        ] = await Promise.all([
          supabase.from('clients').select('*').order('created_at'),
          supabase.from('tasks').select('*').order('created_at'),
          supabase.from('contracts').select('*').order('created_at'),
          supabase.from('account_workflows').select('*').order('created_at'),
          supabase.from('communication_logs').select('*').order('created_at'),
          supabase.from('knowledge_entries').select('*').order('created_at'),
          supabase.from('sop_checklists').select('*').order('title'),
          supabase.from('quick_notes').select('*').order('created_at'),
          supabase.from('communication_templates').select('*').order('title'),
          supabase.from('quick_replies').select('*').order('created_at'),
          supabase.from('goals').select('*').order('created_at'),
        ]);

        set({
          clients: (clients || []).map(r => mapClient(r as Record<string, unknown>)),
          tasks: (tasks || []).map(r => mapTask(r as Record<string, unknown>)),
          contracts: (contracts || []).map(r => mapContract(r as Record<string, unknown>)),
          accountWorkflows: (accountWorkflows || []).map(r => mapWorkflow(r as Record<string, unknown>)),
          communicationLogs: (communicationLogs || []).map(r => mapCommLog(r as Record<string, unknown>)),
          knowledgeEntries: (knowledgeEntries || []).map(r => mapKnowledge(r as Record<string, unknown>)),
          sopChecklists: (sopChecklists || []).map(r => mapSOP(r as Record<string, unknown>)),
          quickNotes: (quickNotes || []).map(r => mapQuickNote(r as Record<string, unknown>)),
          communicationTemplates: (communicationTemplates || []).map(r => mapTemplate(r as Record<string, unknown>)),
          quickReplies: (quickReplies || []).map(r => mapQuickReply(r as Record<string, unknown>)),
          goals: (goals || []).map(r => mapGoal(r as Record<string, unknown>)),
          initialized: true,
        });
      },

      // ── Clients ──
      addClient: async (clientData) => {
        const id = uuid();
        const n = now();
        const ownerId = await getOwnerId();
        const newClient: Client = { ...clientData, id, createdAt: n, updatedAt: n, ownerId };
        set(s => ({ clients: [...s.clients, newClient] }));
        const { error } = await supabase.from('clients').insert(clientToDb(newClient));
        if (error) {
          console.error('[addClient] INSERT failed:', error.message, error.details, error.hint);
          set(s => ({ clients: s.clients.filter(c => c.id !== id) })); // rollback
          throw new Error(error.message);
        }
      },
      updateClient: async (id, updates) => {
        const n = now();
        const prev = get().clients.find(c => c.id === id);
        set(s => ({ clients: s.clients.map(c => c.id === id ? { ...c, ...updates, updatedAt: n } : c) }));
        const { error } = await supabase.from('clients').update({ ...clientToDb(updates), updated_at: n }).eq('id', id);
        if (error) {
          console.error('[updateClient] UPDATE failed:', error.message);
          if (prev) set(s => ({ clients: s.clients.map(c => c.id === id ? prev : c) }));
        }
      },
      deleteClient: async (id) => {
        const prev = get().clients.find(c => c.id === id);
        set(s => ({ clients: s.clients.filter(c => c.id !== id) }));
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) {
          console.error('[deleteClient] DELETE failed:', error.message);
          if (prev) set(s => ({ clients: [...s.clients, prev] }));
        }
      },

      // ── Tasks ──
      addTask: async (taskData) => {
        const id = uuid();
        const ownerId = await getOwnerId();
        const newTask: Task = { ...taskData, id, createdAt: now(), ownerId };
        set(s => ({ tasks: [...s.tasks, newTask] }));
        const { error } = await supabase.from('tasks').insert(taskToDb(newTask));
        if (error) {
          console.error('[addTask] INSERT failed:', error.message, error.details, error.hint);
          set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }));
          throw new Error(error.message);
        }
      },
      updateTask: async (id, updates) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
        const { error } = await supabase.from('tasks').update(taskToDb(updates)).eq('id', id);
        if (error) console.error('[updateTask] UPDATE failed:', error.message);
      },
      deleteTask: async (id) => {
        set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }));
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) console.error('[deleteTask] DELETE failed:', error.message);
      },
      toggleTaskChecklistItem: async (taskId, itemId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedItems = (task.checklistItems || []).map(ci =>
          ci.id === itemId ? { ...ci, completed: !ci.completed } : ci
        );
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, checklistItems: updatedItems } : t),
        }));
        await supabase.from('tasks').update({ checklist_items: updatedItems }).eq('id', taskId);
      },

      // ── Contracts ──
      addContract: async (contractData) => {
        const id = uuid();
        const n = now();
        const ownerId = await getOwnerId();
        const newContract: Contract = { ...contractData, id, createdAt: n, updatedAt: n, ownerId };
        set(s => ({ contracts: [...s.contracts, newContract] }));
        const { error } = await supabase.from('contracts').insert(contractToDb(newContract));
        if (error) {
          console.error('[addContract] INSERT failed:', error.message, error.details, error.hint);
          set(s => ({ contracts: s.contracts.filter(c => c.id !== id) }));
          throw new Error(error.message);
        }
      },
      updateContract: async (id, updates) => {
        const n = now();
        set(s => ({ contracts: s.contracts.map(c => c.id === id ? { ...c, ...updates, updatedAt: n } : c) }));
        await supabase.from('contracts').update({ ...contractToDb(updates), updated_at: n }).eq('id', id);
      },
      deleteContract: async (id) => {
        set(s => ({ contracts: s.contracts.filter(c => c.id !== id) }));
        await supabase.from('contracts').delete().eq('id', id);
      },

      // ── Account Workflows ──
      addAccountWorkflow: async (workflowData) => {
        const id = uuid();
        const ownerId = await getOwnerId();
        const newWorkflow: AccountWorkflow = { ...workflowData, id, createdAt: now(), ownerId };
        set(s => ({ accountWorkflows: [...s.accountWorkflows, newWorkflow] }));
        const { error } = await supabase.from('account_workflows').insert(workflowToDb(newWorkflow));
        if (error) {
          console.error('[addAccountWorkflow] INSERT failed:', error.message, error.details, error.hint);
          set(s => ({ accountWorkflows: s.accountWorkflows.filter(w => w.id !== id) }));
          throw new Error(error.message);
        }
      },
      updateAccountWorkflow: async (id, updates) => {
        set(s => ({
          accountWorkflows: s.accountWorkflows.map(w => w.id === id ? { ...w, ...updates } : w),
        }));
        await supabase.from('account_workflows').update(workflowToDb(updates)).eq('id', id);
      },
      updateWorkflowStep: async (workflowId, stepId, updates) => {
        const workflow = get().accountWorkflows.find(w => w.id === workflowId);
        if (!workflow) return;
        const updatedSteps = workflow.steps.map(step =>
          step.id === stepId ? { ...step, ...updates } : step
        );
        set(s => ({
          accountWorkflows: s.accountWorkflows.map(w =>
            w.id === workflowId ? { ...w, steps: updatedSteps } : w
          ),
        }));
        await supabase.from('account_workflows').update({ steps: updatedSteps }).eq('id', workflowId);
      },

      // ── Communication Logs ──
      addCommunicationLog: async (logData) => {
        const id = uuid();
        const newLog: CommunicationLog = { ...logData, id, createdAt: now() };
        set(s => ({ communicationLogs: [...s.communicationLogs, newLog] }));
        await supabase.from('communication_logs').insert(commLogToDb(newLog));
      },
      addInteraction: async (clientId, logData) => {
        const id = uuid();
        const n = now();
        const newLog: CommunicationLog = { ...logData, id, createdAt: n };
        set(s => ({
          communicationLogs: [...s.communicationLogs, newLog],
          clients: s.clients.map(c =>
            c.id === clientId ? { ...c, lastInteractionAt: n, updatedAt: n } : c
          ),
        }));
        await Promise.all([
          supabase.from('communication_logs').insert(commLogToDb(newLog)),
          supabase.from('clients').update({ last_interaction_at: n, updated_at: n }).eq('id', clientId),
        ]);
      },

      // ── Knowledge ──
      addKnowledgeEntry: async (entryData) => {
        const id = uuid();
        const n = now();
        const ownerId = await getOwnerId();
        const newEntry: KnowledgeEntry = { ...entryData, id, createdAt: n, updatedAt: n, ownerId };
        set(s => ({ knowledgeEntries: [...s.knowledgeEntries, newEntry] }));
        const { error } = await supabase.from('knowledge_entries').insert(knowledgeToDb(newEntry));
        if (error) {
          console.error('[addKnowledgeEntry] INSERT failed:', error.message, error.details, error.hint);
          set(s => ({ knowledgeEntries: s.knowledgeEntries.filter(e => e.id !== id) }));
          throw new Error(error.message);
        }
      },
      updateKnowledgeEntry: async (id, updates) => {
        const n = now();
        set(s => ({
          knowledgeEntries: s.knowledgeEntries.map(e => e.id === id ? { ...e, ...updates, updatedAt: n } : e),
        }));
        await supabase.from('knowledge_entries').update({ ...knowledgeToDb(updates), updated_at: n }).eq('id', id);
      },
      deleteKnowledgeEntry: async (id) => {
        set(s => ({ knowledgeEntries: s.knowledgeEntries.filter(e => e.id !== id) }));
        await supabase.from('knowledge_entries').delete().eq('id', id);
      },

      // ── SOP Checklists ──
      addSOPChecklist: async (checklistData) => {
        const id = uuid();
        const ownerId = await getOwnerId();
        const newChecklist: SOPChecklist = { ...checklistData, id, ownerId };
        set(s => ({ sopChecklists: [...s.sopChecklists, newChecklist] }));
        const { error } = await supabase.from('sop_checklists').insert(sopToDb(newChecklist));
        if (error) {
          console.error('[addSOPChecklist] INSERT failed:', error.message, error.details, error.hint);
          set(s => ({ sopChecklists: s.sopChecklists.filter(c => c.id !== id) }));
          throw new Error(error.message);
        }
      },
      updateSOPChecklist: async (id, updates) => {
        set(s => ({
          sopChecklists: s.sopChecklists.map(c => c.id === id ? { ...c, ...updates } : c),
        }));
        await supabase.from('sop_checklists').update(sopToDb(updates)).eq('id', id);
      },

      // ── Quick Notes ──
      addQuickNote: async (noteData) => {
        const id = uuid();
        const newNote: QuickNote = { ...noteData, id, createdAt: now() };
        set(s => ({ quickNotes: [...s.quickNotes, newNote] }));
        await supabase.from('quick_notes').insert(quickNoteToDb(newNote));
      },
      updateQuickNote: async (id, updates) => {
        set(s => ({ quickNotes: s.quickNotes.map(n => n.id === id ? { ...n, ...updates } : n) }));
        await supabase.from('quick_notes').update(quickNoteToDb(updates)).eq('id', id);
      },
      deleteQuickNote: async (id) => {
        set(s => ({ quickNotes: s.quickNotes.filter(n => n.id !== id) }));
        await supabase.from('quick_notes').delete().eq('id', id);
      },

      // ── Communication Templates ──
      addCommunicationTemplate: async (templateData) => {
        const id = uuid();
        const newTemplate: CommunicationTemplate = { ...templateData, id };
        set(s => ({ communicationTemplates: [...s.communicationTemplates, newTemplate] }));
        await supabase.from('communication_templates').insert({ id, ...templateData });
      },
      updateCommunicationTemplate: async (id, updates) => {
        set(s => ({
          communicationTemplates: s.communicationTemplates.map(t => t.id === id ? { ...t, ...updates } : t),
        }));
        await supabase.from('communication_templates').update(updates).eq('id', id);
      },
      deleteCommunicationTemplate: async (id) => {
        set(s => ({ communicationTemplates: s.communicationTemplates.filter(t => t.id !== id) }));
        await supabase.from('communication_templates').delete().eq('id', id);
      },

      // ── Quick Replies ──
      addQuickReply: async (replyData) => {
        const id = uuid();
        const n = now();
        const newReply: QuickReply = { ...replyData, id, usageCount: 0, createdAt: n, updatedAt: n };
        set(s => ({ quickReplies: [...s.quickReplies, newReply] }));
        await supabase.from('quick_replies').insert(quickReplyToDb(newReply));
      },
      updateQuickReply: async (id, updates) => {
        const n = now();
        set(s => ({
          quickReplies: s.quickReplies.map(r => r.id === id ? { ...r, ...updates, updatedAt: n } : r),
        }));
        await supabase.from('quick_replies').update({ ...quickReplyToDb(updates), updated_at: n }).eq('id', id);
      },
      deleteQuickReply: async (id) => {
        set(s => ({ quickReplies: s.quickReplies.filter(r => r.id !== id) }));
        await supabase.from('quick_replies').delete().eq('id', id);
      },
      incrementQuickReplyUsage: async (id) => {
        const reply = get().quickReplies.find(r => r.id === id);
        if (!reply) return;
        const newCount = reply.usageCount + 1;
        const n = now();
        set(s => ({
          quickReplies: s.quickReplies.map(r =>
            r.id === id ? { ...r, usageCount: newCount, updatedAt: n } : r
          ),
        }));
        await supabase.from('quick_replies').update({ usage_count: newCount, updated_at: n }).eq('id', id);
      },

      // ── Goals ──
      addGoal: async (goalData) => {
        const id = uuid();
        const n = now();
        const ownerId = await getOwnerId();
        const newGoal: Goal = { ...goalData, id, createdAt: n, updatedAt: n, ownerId };
        set(s => ({ goals: [...s.goals, newGoal] }));
        const { error } = await supabase.from('goals').insert(goalToDb(newGoal));
        if (error) {
          console.error('[addGoal] INSERT failed:', error.message, error.details, error.hint);
          set(s => ({ goals: s.goals.filter(g => g.id !== id) }));
          throw new Error(error.message);
        }
      },
      updateGoal: async (id, updates) => {
        const n = now();
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...updates, updatedAt: n } : g) }));
        await supabase.from('goals').update({ ...goalToDb(updates), updated_at: n }).eq('id', id);
      },
      deleteGoal: async (id) => {
        set(s => ({ goals: s.goals.filter(g => g.id !== id) }));
        await supabase.from('goals').delete().eq('id', id);
      },

      // ── UI preferences ──
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      activeChecklistProgress: {},
      toggleChecklistProgress: (checklistId, itemId) => set(s => {
        const progress = { ...s.activeChecklistProgress };
        if (!progress[checklistId]) progress[checklistId] = {};
        progress[checklistId] = { ...progress[checklistId], [itemId]: !progress[checklistId][itemId] };
        return { activeChecklistProgress: progress };
      }),
      resetChecklistProgress: (checklistId) => set(s => {
        const progress = { ...s.activeChecklistProgress };
        delete progress[checklistId];
        return { activeChecklistProgress: progress };
      }),

      sidebarCollapsed: false,
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      darkMode: false,
      toggleDarkMode: () => set(s => {
        const next = !s.darkMode;
        document.documentElement.classList.toggle('dark', next);
        return { darkMode: next };
      }),

      language: 'en' as Language,
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'ops-suite-ui',
      // Only persist UI preferences, not data (data comes from Supabase)
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
        language: state.language,
        activeChecklistProgress: state.activeChecklistProgress,
      }),
    }
  )
);

export default useStore;
