-- ============================================
-- BillBuddy — Group Activity Notifications
-- Supabase Dashboard → SQL Editor me paste karo
-- Run once. Idempotent hai (dobara run kar sakte ho).
-- ============================================

-- 19a. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  group_name TEXT NOT NULL DEFAULT '',
  actor_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_time
  ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Har user sirf apni notifications dekhe/read kare.
CREATE POLICY "user_can_view_own_notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_can_mark_own_notifications_read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 19b. RPC — group activity log karke saare participants ko notify karo
-- Recipients = group owner + saare shared users (actor khud bhi).
-- SECURITY DEFINER taaki RLS bypass karke sab recipients ke liye rows ban sake.
CREATE OR REPLACE FUNCTION log_group_activity(
  p_group_id UUID,
  p_action TEXT,
  p_amount NUMERIC DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_member_name TEXT DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_name TEXT;
  v_group_name TEXT;
  v_message TEXT;
BEGIN
  SELECT COALESCE(NULLIF(p.display_name, ''), split_part(u.email, '@', 1), 'Someone')
  INTO v_actor_name
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = auth.uid()
  LIMIT 1;

  IF v_actor_name IS NULL THEN
    v_actor_name := 'Someone';
  END IF;

  SELECT name INTO v_group_name FROM groups WHERE id = p_group_id;
  IF v_group_name IS NULL THEN
    v_group_name := 'Group';
  END IF;

  v_message := CASE p_action
    WHEN 'expense_added' THEN
      v_actor_name || ' ne ₹' || COALESCE(ROUND(p_amount)::text, '0') || ' ka "' || COALESCE(p_description, '') || '" add kiya'
    WHEN 'expense_updated' THEN
      v_actor_name || ' ne "' || COALESCE(p_description, '') || '" update kiya'
    WHEN 'expense_deleted' THEN
      v_actor_name || ' ne "' || COALESCE(p_description, '') || '" delete kar diya'
    WHEN 'member_added' THEN
      v_actor_name || ' ne "' || COALESCE(p_member_name, '') || '" ko member banaya'
    WHEN 'settlement_planned' THEN
      v_actor_name || ' ne settle plan banaya'
    ELSE
      v_actor_name || ' ne ' || v_group_name || ' me activity ki'
  END;

  INSERT INTO notifications (user_id, group_id, group_name, actor_name, action, message)
  SELECT user_id, p_group_id, v_group_name, v_actor_name, p_action, v_message
  FROM (
    SELECT user_id FROM groups WHERE id = p_group_id
    UNION
    SELECT user_id FROM shared_groups WHERE group_id = p_group_id
  ) recipients
  WHERE user_id IS NOT NULL;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION log_group_activity(UUID, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_group_activity(UUID, TEXT, NUMERIC, TEXT, TEXT) TO authenticated;
