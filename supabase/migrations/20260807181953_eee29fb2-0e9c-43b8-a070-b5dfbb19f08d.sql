ALTER TABLE public.paychecks
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS income_type text NOT NULL DEFAULT 'paycheck';