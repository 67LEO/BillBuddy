-- ============================================================
-- BillBuddy — RPC Functions (Admin + Duplicate Mobile + Shared Groups)
-- ------------------------------------------------------------
-- HOW TO RUN:
--   1. Supabase Dashboard kholo
--   2. Left sidebar → "SQL Editor" (or "SQL Editor" > "New query")
--   3. Is poora block copy karo
--   4. Paste karo aur "Run" button dabao
--   5. Saare "Success" messages aane chahiye — bas ho gaya!
--
-- Yeh block SAB kuch create karta hai:
--   • find_groups_by_member_mobile()  → group auto-share (dost ke mobile se)
--   • is_admin()                      → admin check (2 emails)
--   • get_all_users()                 → admin panel user list
--   • check_mobile_exists()           → duplicate mobile check
-- ============================================================

-- 1) Shared groups auto-link (dost ka mobile → group share)
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

-- 2) Admin check — sirf 2 emails
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'kingorwot007@gmail.com',
      'mohitoza338@gmail.com'
    ),
    false
  );
$$;

-- 3) Sab users ki list (sirf admin dekh sakta hai)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  mobile TEXT,
  mobile2 TEXT,
  created_at TIMESTAMPTZ,
  groups_count BIGINT,
  expenses_count BIGINT,
  account_entries BIGINT,
  contacts_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.id::uuid AS user_id,
    u.email::text AS email,
    COALESCE(p.display_name, '')::text AS display_name,
    COALESCE(p.mobile, '')::text AS mobile,
    COALESCE(p.mobile2, '')::text AS mobile2,
    u.created_at::timestamptz AS created_at,
    (SELECT COUNT(*)::bigint FROM groups g WHERE g.user_id = u.id) AS groups_count,
    (SELECT COUNT(*)::bigint FROM expenses e WHERE e.group_id IN (SELECT id FROM groups g WHERE g.user_id = u.id)) AS expenses_count,
    (SELECT COUNT(*)::bigint FROM accounts a WHERE a.user_id = u.id) AS account_entries,
    (SELECT COUNT(*)::bigint FROM contacts c WHERE c.user_id = u.id) AS contacts_count
  FROM auth.users u
  LEFT JOIN profiles p ON p.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- 4) Duplicate mobile check — masked info (naam/email chhupa ke)
CREATE OR REPLACE FUNCTION check_mobile_exists(mobile_numbers TEXT[])
RETURNS TABLE (
  mobile TEXT,
  display_name_masked TEXT,
  email_masked TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  me UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    m::text AS mobile,
    CASE
      WHEN COALESCE(p.display_name, '') = '' THEN 'Unknown'::text
      ELSE left(p.display_name, 1) || repeat('*', greatest(1, length(p.display_name) - 1))
    END::text AS display_name_masked,
    left(split_part(u.email, '@', 1), 1) || repeat('*', greatest(1, length(split_part(u.email, '@', 1)) - 1)) || '@' || split_part(u.email, '@', 2) AS email_masked
  FROM unnest(mobile_numbers) AS m
  JOIN profiles p ON (p.mobile = m OR p.mobile2 = m) AND p.user_id != me
  JOIN auth.users u ON u.id = p.user_id
  WHERE m IS NOT NULL AND m <> ''
  ORDER BY m;
END;
$$;

-- 5) Permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
REVOKE ALL ON FUNCTION get_all_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
REVOKE ALL ON FUNCTION check_mobile_exists(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_mobile_exists(TEXT[]) TO authenticated;
