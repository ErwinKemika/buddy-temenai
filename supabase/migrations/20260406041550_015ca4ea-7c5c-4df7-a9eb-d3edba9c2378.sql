
-- Add avatar_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Update handle_new_user to extract nickname
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  _nickname text;
BEGIN
  -- Try full_name from OAuth metadata
  _nickname := NEW.raw_user_meta_data->>'full_name';
  
  -- Fallback: part before @ from email
  IF _nickname IS NULL OR _nickname = '' THEN
    _nickname := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (user_id, plan, trial_expires_at, nickname)
  VALUES (NEW.id, 'trial', NOW() + INTERVAL '3 days', _nickname)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
