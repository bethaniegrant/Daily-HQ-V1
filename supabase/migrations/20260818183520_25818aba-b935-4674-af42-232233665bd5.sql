CREATE TABLE public.task_deferrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  deferred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.task_deferrals TO authenticated;
GRANT ALL ON public.task_deferrals TO service_role;
ALTER TABLE public.task_deferrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own task deferrals" ON public.task_deferrals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view their own task deferrals" ON public.task_deferrals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX task_deferrals_user_task_idx ON public.task_deferrals (user_id, task_id);