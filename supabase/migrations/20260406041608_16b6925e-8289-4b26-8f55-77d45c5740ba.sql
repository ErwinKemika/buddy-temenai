
-- Fix search_path on handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _nickname text;
BEGIN
  _nickname := NEW.raw_user_meta_data->>'full_name';
  IF _nickname IS NULL OR _nickname = '' THEN
    _nickname := split_part(NEW.email, '@', 1);
  END IF;
  INSERT INTO public.profiles (user_id, plan, trial_expires_at, nickname)
  VALUES (NEW.id, 'trial', NOW() + INTERVAL '3 days', _nickname)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Add basic RLS policy for reminder_logs
CREATE POLICY "Service role access for reminder_logs"
ON public.reminder_logs FOR ALL
USING (true)
WITH CHECK (true);
