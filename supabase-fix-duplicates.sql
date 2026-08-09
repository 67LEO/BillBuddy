-- ============================================================
-- BillBuddy — Duplicate Mobile Cleanup + Hard Prevention
-- ------------------------------------------------------------
-- HOW TO RUN:
--   1. Supabase Dashboard kholo
--   2. Left sidebar → "SQL Editor" → "New query"
--   3. Is poora block copy karo
--   4. Paste karo aur "Run" dabao
--
-- Ye block 2 cheezein karta hai:
--   STEP 1: Purane duplicates clean — ek number sirf us account pe
--           rahega jisne SABSE PEHLE use kiya (sabse purana created_at).
--           Baaki sab accounts se wo number blank ho jayega.
--   STEP 2: Trigger — ab se koi doosra account wo number use hi nahi
--           kar payega (save fail ho jayega). Khud ka apna number
--           khud ke mobile/mobile2 me daalna allowed hai.
-- ============================================================

-- ============================================================
-- STEP 1 — Purane duplicates clean karo
-- ============================================================
DO $$
DECLARE
  rec RECORD;
  keeper_id UUID;
  cleared BIGINT;
BEGIN
  FOR rec IN
    SELECT DISTINCT num
    FROM (
      SELECT mobile AS num FROM profiles WHERE mobile <> ''
      UNION
      SELECT mobile2 AS num FROM profiles WHERE mobile2 <> ''
    ) t
  LOOP
    -- Sabse pehle use karne wala account dhoondo
    SELECT id INTO keeper_id
    FROM profiles
    WHERE mobile = rec.num OR mobile2 = rec.num
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    IF keeper_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Baaki sab se number blank karo (keeper se EXCEPT karke)
    UPDATE profiles
    SET mobile  = CASE WHEN mobile  = rec.num THEN '' ELSE mobile  END,
        mobile2 = CASE WHEN mobile2 = rec.num THEN '' ELSE mobile2 END
    WHERE id <> keeper_id
      AND (mobile = rec.num OR mobile2 = rec.num);
  END LOOP;
END $$;

-- ============================================================
-- STEP 2 — Future prevention (hard-block trigger)
-- Ab se koi naya/updated number kisi AUR account me pehle se ho
-- to save fail ho jayega. SECURITY DEFINER (postgres owner) taaki
-- RLS bypass karke SAB profiles ki rows check ho sakein.
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_duplicate_mobile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Naya mobile number check
  IF NEW.mobile IS NOT NULL AND NEW.mobile <> '' AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id <> NEW.id
      AND (mobile = NEW.mobile OR mobile2 = NEW.mobile)
  ) THEN
    RAISE EXCEPTION 'Mobile number % already in use by another account', NEW.mobile;
  END IF;

  -- Naya mobile2 number check (agar khud ke mobile se alag hai)
  IF NEW.mobile2 IS NOT NULL AND NEW.mobile2 <> ''
     AND NEW.mobile2 <> COALESCE(NEW.mobile, '') AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id <> NEW.id
      AND (mobile = NEW.mobile2 OR mobile2 = NEW.mobile2)
  ) THEN
    RAISE EXCEPTION 'Mobile number % already in use by another account', NEW.mobile2;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_no_dup_mobile ON profiles;
CREATE TRIGGER trg_profiles_no_dup_mobile
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_mobile();
