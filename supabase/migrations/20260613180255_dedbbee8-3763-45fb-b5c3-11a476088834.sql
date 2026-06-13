CREATE POLICY "No direct client access to invite tokens"
ON public.invite_tokens
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);