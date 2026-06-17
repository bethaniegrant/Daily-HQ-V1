ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified_deadline timestamptz;

-- Backfill existing rows: 48h from created_at
UPDATE public.profiles
SET email_verified_deadline = created_at + interval '48 hours'
WHERE email_verified_deadline IS NULL;

-- Update the signup trigger to set the deadline at signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, access_revoked, email_verified_deadline)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    false,
    now() + interval '48 hours'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    access_revoked = false,
    email_verified_deadline = COALESCE(public.profiles.email_verified_deadline, EXCLUDED.email_verified_deadline);

  RETURN NEW;
END;
$function$;