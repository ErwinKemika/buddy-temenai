
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz DEFAULT (now() + interval '3 days'),
  ADD COLUMN IF NOT EXISTS pro_since timestamptz,
  ADD COLUMN IF NOT EXISTS pro_expires_at timestamptz;
