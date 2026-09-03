CREATE OR REPLACE FUNCTION public.set_email_vt(queue_name text, message_id bigint, vt_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pgmq'
AS $function$
BEGIN
  PERFORM pgmq.set_vt(queue_name, message_id, vt_seconds);
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_email_vt(text, bigint, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_email_vt(text, bigint, integer) TO service_role;