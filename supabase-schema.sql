-- ============================================
-- BillBuddy Database Schema
-- Supabase Dashboard → SQL Editor me paste karo
-- ============================================

-- 1. Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Members table (group ke andar ke log)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- 3. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES members(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  present_members UUID[] NOT NULL DEFAULT '{}',
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Row Level Security (har user sirf apna data dekhe)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_manage_own_groups"
  ON groups FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_can_manage_own_members"
  ON members FOR ALL
  USING (
    group_id IN (SELECT id FROM groups WHERE user_id = auth.uid())
  );

CREATE POLICY "user_can_manage_own_expenses"
  ON expenses FOR ALL
  USING (
    group_id IN (SELECT id FROM groups WHERE user_id = auth.uid())
  );

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_groups_user ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
