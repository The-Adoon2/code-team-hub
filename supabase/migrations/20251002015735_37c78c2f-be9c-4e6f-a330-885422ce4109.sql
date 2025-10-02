-- Create messages table for group chat
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_code TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages
CREATE POLICY "Anyone can view messages"
  ON public.messages
  FOR SELECT
  USING (true);

-- Anyone can insert messages
CREATE POLICY "Anyone can insert messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (true);

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
  ON public.messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.code = current_setting('app.current_user_code', true)
      AND profiles.is_admin = true
    )
  );

-- Enable realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;