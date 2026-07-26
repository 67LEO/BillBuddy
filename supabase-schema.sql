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

-- 7. Profiles table (logged-in user ka data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  mobile2 TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_manage_own_profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);

-- 8. Contacts table (sab logon ka master data)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT DEFAULT '',
  email TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_manage_own_contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id);

-- 9. Accounts table (diya/liya ledger)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('diya', 'liya')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'general',
  note TEXT DEFAULT '',
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  mobile TEXT DEFAULT '',
  is_recurring BOOLEAN DEFAULT false,
  recurring_freq TEXT DEFAULT NULL,
  recurring_day INTEGER DEFAULT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ DEFAULT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_manage_own_accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id);

-- 10. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📝',
  color TEXT DEFAULT '#3A2C5C',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_manage_own_categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id);

-- 11. Members table updates (mobile + contact linking)
ALTER TABLE members ADD COLUMN IF NOT EXISTS mobile TEXT DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- 12. Saved Persons (frequently used people for Account)
CREATE TABLE IF NOT EXISTS saved_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  default_type TEXT NOT NULL CHECK (default_type IN ('diya', 'liya')),
  default_amount NUMERIC(12,2) DEFAULT 0,
  default_category TEXT DEFAULT 'general',
  mobile TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saved_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_manage_own_saved_persons"
  ON saved_persons FOR ALL
  USING (auth.uid() = user_id);

-- 13. Performance indexes
CREATE INDEX IF NOT EXISTS idx_groups_user ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_person ON accounts(user_id, person_name);
CREATE INDEX IF NOT EXISTS idx_accounts_date ON accounts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_persons_user ON saved_persons(user_id);

-- 14. Shared Groups (auto-linked via mobile number)
CREATE TABLE IF NOT EXISTS shared_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  member_name TEXT NOT NULL,
  shared_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shared_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_view_own_shared_groups"
  ON shared_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owner_can_manage_shared_groups"
  ON shared_groups FOR ALL
  USING (
    group_id IN (SELECT id FROM groups WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_shared_groups_user ON shared_groups(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_groups_unique ON shared_groups(group_id, user_id);

-- 15. Last edited by tracking on expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS last_edited_by TEXT DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- 16. RPC: find groups that have members matching given mobile numbers
CREATE OR REPLACE FUNCTION find_groups_by_member_mobile(mobile_numbers TEXT[])
RETURNS TABLE (
  group_id UUID,
  member_id UUID,
  member_name TEXT,
  group_owner_id UUID,
  owner_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.group_id,
    m.id AS member_id,
    m.name AS member_name,
    g.user_id AS group_owner_id,
    COALESCE(p.display_name, '') AS owner_name
  FROM members m
  JOIN groups g ON g.id = m.group_id
  LEFT JOIN profiles p ON p.user_id = g.user_id
  WHERE m.mobile = ANY(mobile_numbers)
    AND g.user_id != auth.uid();
END;
$$;
