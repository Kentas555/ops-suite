-- ============================================================
-- OpsSuite — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor (one paste).
-- ============================================================

-- Profiles (extends auth.users — auto-created on signup via trigger)
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  display_name    text        not null default '',
  role            text        not null default 'user' check (role in ('admin', 'user')),
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz
);

-- Clients
create table if not exists public.clients (
  id                      uuid        primary key default gen_random_uuid(),
  company_name            text        not null default '',
  phone                   text        not null default '',
  responsible_person      text        not null default '',
  responsible_person_role text,
  status                  text        not null default 'prospect',
  account_status          text        not null default 'pending_creation',
  contract_status         text        not null default 'draft',
  onboarding_stage        text        not null default 'initial_contact',
  next_follow_up          timestamptz,
  last_interaction_at     timestamptz,
  next_action             text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Tasks (checklist_items stored as JSONB)
create table if not exists public.tasks (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null default '',
  description         text        not null default '',
  status              text        not null default 'todo',
  priority            text        not null default 'medium',
  client_id           uuid        references public.clients(id) on delete set null,
  client_name         text,
  category            text        not null default '',
  due_date            date,
  due_time            text,
  completed_at        timestamptz,
  is_recurring        boolean     not null default false,
  recurring_interval  text,
  notes               text        not null default '',
  checklist_items     jsonb       not null default '[]',
  created_at          timestamptz not null default now()
);

-- Contracts (documents + missing_items as JSONB)
create table if not exists public.contracts (
  id               uuid        primary key default gen_random_uuid(),
  client_id        uuid        not null references public.clients(id) on delete cascade,
  client_name      text        not null default '',
  contract_number  text        not null default '',
  type             text        not null default '',
  status           text        not null default 'draft',
  start_date       date,
  end_date         date,
  value            numeric,
  currency         text        not null default 'EUR',
  documents        jsonb       not null default '[]',
  notes            text        not null default '',
  missing_items    jsonb       not null default '[]',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Account Workflows (steps as JSONB)
create table if not exists public.account_workflows (
  id           uuid        primary key default gen_random_uuid(),
  client_id    uuid        not null references public.clients(id) on delete cascade,
  client_name  text        not null default '',
  type         text        not null check (type in ('create', 'update', 'close')),
  status       text        not null default 'not_started',
  steps        jsonb       not null default '[]',
  notes        text        not null default '',
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- Communication Logs
create table if not exists public.communication_logs (
  id             uuid        primary key default gen_random_uuid(),
  client_id      uuid        not null references public.clients(id) on delete cascade,
  client_name    text        not null default '',
  type           text        not null default 'email',
  subject        text        not null default '',
  summary        text        not null default '',
  next_action    text,
  contact_person text,
  created_at     timestamptz not null default now()
);

-- Knowledge Entries (bilingual title/content as JSONB)
create table if not exists public.knowledge_entries (
  id         uuid        primary key default gen_random_uuid(),
  title      jsonb       not null default '{"lt":"","en":""}',
  content    jsonb       not null default '{"lt":"","en":""}',
  category   text        not null default 'general',
  tags       text[]      not null default '{}',
  is_pinned  boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SOP Checklists (items as JSONB)
create table if not exists public.sop_checklists (
  id             uuid    primary key default gen_random_uuid(),
  title          text    not null default '',
  description    text    not null default '',
  category       text    not null default '',
  items          jsonb   not null default '[]',
  estimated_time text,
  last_used      timestamptz,
  usage_count    integer not null default 0
);

-- Quick Notes
create table if not exists public.quick_notes (
  id         uuid        primary key default gen_random_uuid(),
  content    text        not null default '',
  is_pinned  boolean     not null default false,
  color      text        not null default 'yellow',
  created_at timestamptz not null default now()
);

-- Communication Templates
create table if not exists public.communication_templates (
  id        uuid    primary key default gen_random_uuid(),
  title     text    not null default '',
  category  text    not null default '',
  subject   text,
  body      text    not null default '',
  variables text[]  not null default '{}'
);

-- Quick Replies (bilingual title/message as JSONB)
create table if not exists public.quick_replies (
  id          uuid        primary key default gen_random_uuid(),
  title       jsonb       not null default '{"lt":"","en":""}',
  category    text        not null default 'general',
  message     jsonb       not null default '{"lt":"","en":""}',
  usage_count integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Goals (per-user)
create table if not exists public.goals (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null default '',
  period     text        not null default 'month',
  status     text        not null default 'in_progress',
  reflection text        not null default '',
  user_id    uuid        not null references auth.users(id) on delete cascade,
  user_name  text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reminders (per-user)
create table if not exists public.reminders (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null default '',
  description  text,
  due_at       timestamptz not null,
  client_id    uuid        references public.clients(id) on delete set null,
  client_name  text,
  is_read      boolean     not null default false,
  is_dismissed boolean     not null default false,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles              enable row level security;
alter table public.clients               enable row level security;
alter table public.tasks                 enable row level security;
alter table public.contracts             enable row level security;
alter table public.account_workflows     enable row level security;
alter table public.communication_logs    enable row level security;
alter table public.knowledge_entries     enable row level security;
alter table public.sop_checklists        enable row level security;
alter table public.quick_notes           enable row level security;
alter table public.communication_templates enable row level security;
alter table public.quick_replies         enable row level security;
alter table public.goals                 enable row level security;
alter table public.reminders             enable row level security;

-- Profiles: any authenticated user can read; only update own row
create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- Shared team data: all authenticated users have full access
create policy "clients_all"    on public.clients               for all using (auth.role() = 'authenticated');
create policy "tasks_all"      on public.tasks                 for all using (auth.role() = 'authenticated');
create policy "contracts_all"  on public.contracts             for all using (auth.role() = 'authenticated');
create policy "workflows_all"  on public.account_workflows     for all using (auth.role() = 'authenticated');
create policy "commlogs_all"   on public.communication_logs    for all using (auth.role() = 'authenticated');
create policy "knowledge_all"  on public.knowledge_entries     for all using (auth.role() = 'authenticated');
create policy "sop_all"        on public.sop_checklists        for all using (auth.role() = 'authenticated');
create policy "notes_all"      on public.quick_notes           for all using (auth.role() = 'authenticated');
create policy "templates_all"  on public.communication_templates for all using (auth.role() = 'authenticated');
create policy "replies_all"    on public.quick_replies         for all using (auth.role() = 'authenticated');

-- Per-user data: each user sees only their own rows
create policy "goals_all"     on public.goals     for all using (auth.uid() = user_id);
create policy "reminders_all" on public.reminders for all using (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile when a new user signs up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
