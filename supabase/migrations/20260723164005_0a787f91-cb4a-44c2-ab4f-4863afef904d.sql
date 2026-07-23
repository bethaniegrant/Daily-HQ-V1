CREATE TABLE public.paychecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_received date NOT NULL,
  expected_amount numeric NOT NULL,
  actual_amount numeric,
  pay_frequency text NOT NULL CHECK (pay_frequency IN ('weekly', 'biweekly', 'monthly')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.paychecks TO authenticated;
GRANT ALL ON public.paychecks TO service_role;

ALTER TABLE public.paychecks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own paychecks" ON public.paychecks
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());