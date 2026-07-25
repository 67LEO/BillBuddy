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
  split_details JSONB DEFAULT NULL,
  split_mode TEXT DEFAULT 'equal' CHECK (split_mode IN ('equal', 'custom')),
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration for existing databases: add split_details & split_mode columns
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_details JSONB DEFAULT NULL;
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_mode TEXT DEFAULT 'equal' CHECK (split_mode IN ('equal', 'custom'));

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

-- 5. Bills table (Quick Bill Calculator)
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  difference NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_manage_own_bills"
  ON bills FOR ALL
  USING (auth.uid() = user_id);

-- 6. Saved Items (reusable item library)
CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_manage_own_saved_items"
  ON saved_items FOR ALL
  USING (auth.uid() = user_id);

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_groups_user ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);
