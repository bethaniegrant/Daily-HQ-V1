CREATE OR REPLACE FUNCTION public.enforce_allowed_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT lower(email) INTO user_email FROM auth.users WHERE id = NEW.id;
  IF user_email IS DISTINCT FROM 'hello.bethanierose@gmail.com' THEN
    NEW.access_revoked := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_allowed_email_trigger ON public.profiles;
CREATE TRIGGER enforce_allowed_email_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_allowed_email();