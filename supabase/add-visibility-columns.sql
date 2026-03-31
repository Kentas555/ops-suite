-- ============================================================
-- VISIBILITY SYSTEM: Add owner_id, visibility, shared_with
-- to all 7 core tables + RLS policies
-- ============================================================
-- Run this ONCE in Supabase SQL Editor (supabase.com → SQL Editor → New query)
-- ============================================================

-- ── 1. ADD COLUMNS (safe: IF NOT EXISTS) ─────────────────────

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clients', 'tasks', 'contracts', 'account_workflows',
    'knowledge_entries', 'sop_checklists', 'goals'
  ]
  LOOP
    -- owner_id: FK to auth.users
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)',
      tbl
    );
    -- visibility: private / team / selected
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT ''team''',
      tbl
    );
    -- shared_with: array of user IDs (used when visibility = ''selected'')
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS shared_with uuid[] NOT NULL DEFAULT ''{}''',
      tbl
    );
  END LOOP;
END
$$;

-- ── 2. ENABLE RLS (safe: idempotent) ────────────────────────

ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_workflows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_checklists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals              ENABLE ROW LEVEL SECURITY;

-- ── 3. RLS POLICIES ─────────────────────────────────────────
-- For each table: SELECT (based on visibility), INSERT/UPDATE/DELETE (owner only)

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clients', 'tasks', 'contracts', 'account_workflows',
    'knowledge_entries', 'sop_checklists', 'goals'
  ]
  LOOP
    -- Drop existing policies to avoid conflicts
    EXECUTE format('DROP POLICY IF EXISTS "visibility_select" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "visibility_insert" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "visibility_update" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "visibility_delete" ON %I', tbl);

    -- SELECT: owner sees own, team = all, selected = shared_with
    EXECUTE format(
      'CREATE POLICY "visibility_select" ON %I FOR SELECT TO authenticated USING (
        owner_id = auth.uid()
        OR visibility = ''team''
        OR (visibility = ''selected'' AND auth.uid() = ANY(shared_with))
      )', tbl
    );

    -- INSERT: must set yourself as owner
    EXECUTE format(
      'CREATE POLICY "visibility_insert" ON %I FOR INSERT TO authenticated WITH CHECK (
        owner_id = auth.uid()
      )', tbl
    );

    -- UPDATE: only owner can update
    EXECUTE format(
      'CREATE POLICY "visibility_update" ON %I FOR UPDATE TO authenticated USING (
        owner_id = auth.uid()
      )', tbl
    );

    -- DELETE: only owner can delete
    EXECUTE format(
      'CREATE POLICY "visibility_delete" ON %I FOR DELETE TO authenticated USING (
        owner_id = auth.uid()
      )', tbl
    );
  END LOOP;
END
$$;

-- ── 4. PROFILES: allow all authenticated to read ────────────

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

-- ── 5. BACKFILL: set owner_id for existing rows ────────────
-- Sets owner_id to the first admin user for any existing data
-- that was created before this migration

DO $$
DECLARE
  tbl text;
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users LIMIT 1;
  IF admin_id IS NOT NULL THEN
    FOREACH tbl IN ARRAY ARRAY[
      'clients', 'tasks', 'contracts', 'account_workflows',
      'knowledge_entries', 'sop_checklists', 'goals'
    ]
    LOOP
      EXECUTE format(
        'UPDATE %I SET owner_id = %L WHERE owner_id IS NULL',
        tbl, admin_id
      );
    END LOOP;
  END IF;
END
$$;
