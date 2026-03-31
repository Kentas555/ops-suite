-- ============================================================
-- CLEANUP: Remove duplicate RLS policies, fix UPDATE rules
-- ============================================================
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- ── 1. DROP OLD DUPLICATE POLICIES ──────────────────────────
-- These were from the first migration. The visibility_* set is canonical.

-- clients
DROP POLICY IF EXISTS "clients_sel" ON clients;
DROP POLICY IF EXISTS "clients_ins" ON clients;
DROP POLICY IF EXISTS "clients_upd" ON clients;
DROP POLICY IF EXISTS "clients_del" ON clients;

-- tasks
DROP POLICY IF EXISTS "tasks_sel" ON tasks;
DROP POLICY IF EXISTS "tasks_ins" ON tasks;
DROP POLICY IF EXISTS "tasks_upd" ON tasks;
DROP POLICY IF EXISTS "tasks_del" ON tasks;

-- contracts
DROP POLICY IF EXISTS "contracts_sel" ON contracts;
DROP POLICY IF EXISTS "contracts_ins" ON contracts;
DROP POLICY IF EXISTS "contracts_upd" ON contracts;
DROP POLICY IF EXISTS "contracts_del" ON contracts;

-- account_workflows
DROP POLICY IF EXISTS "workflows_sel" ON account_workflows;
DROP POLICY IF EXISTS "workflows_ins" ON account_workflows;
DROP POLICY IF EXISTS "workflows_upd" ON account_workflows;
DROP POLICY IF EXISTS "workflows_del" ON account_workflows;

-- knowledge_entries
DROP POLICY IF EXISTS "knowledge_sel" ON knowledge_entries;
DROP POLICY IF EXISTS "knowledge_ins" ON knowledge_entries;
DROP POLICY IF EXISTS "knowledge_upd" ON knowledge_entries;
DROP POLICY IF EXISTS "knowledge_del" ON knowledge_entries;

-- sop_checklists
DROP POLICY IF EXISTS "checklists_sel" ON sop_checklists;
DROP POLICY IF EXISTS "checklists_ins" ON sop_checklists;
DROP POLICY IF EXISTS "checklists_upd" ON sop_checklists;
DROP POLICY IF EXISTS "checklists_del" ON sop_checklists;

-- goals
DROP POLICY IF EXISTS "goals_sel" ON goals;
DROP POLICY IF EXISTS "goals_ins" ON goals;
DROP POLICY IF EXISTS "goals_upd" ON goals;
DROP POLICY IF EXISTS "goals_del" ON goals;

-- profiles (redundant select)
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- ── 2. FIX UPDATE POLICIES ─────────────────────────────────
-- Current visibility_update = owner only (too restrictive).
-- Fix: allow team members and shared users to update visible items.

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clients', 'tasks', 'contracts', 'account_workflows',
    'knowledge_entries', 'sop_checklists', 'goals'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "visibility_update" ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY "visibility_update" ON %I FOR UPDATE TO authenticated USING (
        owner_id = auth.uid()
        OR visibility = ''team''
        OR (visibility = ''selected'' AND auth.uid() = ANY(shared_with))
      )', tbl
    );
  END LOOP;
END
$$;
