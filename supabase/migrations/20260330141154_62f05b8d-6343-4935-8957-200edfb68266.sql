
-- Drop existing todos table and recreate with new schema
DROP TABLE IF EXISTS public.todos CASCADE;

CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean DEFAULT false,
  date date NOT NULL,
  start_time time,
  end_time time,
  started_at timestamptz,
  completed_at timestamptz,
  is_running boolean DEFAULT false,
  priority text DEFAULT 'medium',
  status text DEFAULT 'todo',
  category text,
  recurrence text DEFAULT 'once',
  effort text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own todos" ON public.todos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own todos" ON public.todos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create reminder_logs table
CREATE TABLE public.reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id uuid REFERENCES public.todos(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  sent_date date NOT NULL,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(todo_id, reminder_type, sent_date)
);
