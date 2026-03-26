
CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  deadline date,
  start_time text,
  end_time text,
  priority text NOT NULL DEFAULT 'medium',
  category text,
  recurrence text DEFAULT 'once',
  effort text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own todos" ON public.todos
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own todos" ON public.todos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own todos" ON public.todos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own todos" ON public.todos
  FOR DELETE TO authenticated USING (user_id = auth.uid());
