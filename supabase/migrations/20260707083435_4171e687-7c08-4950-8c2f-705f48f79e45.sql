
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS balance numeric NOT NULL DEFAULT 0;

DO $$ BEGIN
  CREATE TYPE public.due_party AS ENUM ('customer','supplier');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.due_kind AS ENUM ('charge','payment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.dues_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_type public.due_party NOT NULL,
  party_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  kind public.due_kind NOT NULL,
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dues_transactions TO authenticated;
GRANT ALL ON public.dues_transactions TO service_role;

ALTER TABLE public.dues_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dues_own_select ON public.dues_transactions;
CREATE POLICY dues_own_select ON public.dues_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS dues_own_insert ON public.dues_transactions;
CREATE POLICY dues_own_insert ON public.dues_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS dues_own_update ON public.dues_transactions;
CREATE POLICY dues_own_update ON public.dues_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS dues_own_delete ON public.dues_transactions;
CREATE POLICY dues_own_delete ON public.dues_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS dues_transactions_user_party_idx ON public.dues_transactions (user_id, party_type, party_id, occurred_at DESC);
