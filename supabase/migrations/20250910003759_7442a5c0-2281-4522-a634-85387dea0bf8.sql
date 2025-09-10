-- Create time_sessions table to track individual check-in/check-out sessions
CREATE TABLE public.time_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_code TEXT NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out_time TIMESTAMP WITH TIME ZONE NULL,
  total_hours DECIMAL(5,2) NULL,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_time_sessions_user_code ON public.time_sessions(user_code);
CREATE INDEX idx_time_sessions_check_in_time ON public.time_sessions(check_in_time DESC);

-- Enable Row Level Security
ALTER TABLE public.time_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_sessions
CREATE POLICY "Anyone can view time sessions" 
ON public.time_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own time sessions" 
ON public.time_sessions 
FOR INSERT 
WITH CHECK (user_code = current_setting('app.current_user_code', true));

CREATE POLICY "Users can update their own active sessions" 
ON public.time_sessions 
FOR UPDATE 
USING (user_code = current_setting('app.current_user_code', true) AND check_out_time IS NULL);

CREATE POLICY "Admins can update any time session" 
ON public.time_sessions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE code = current_setting('app.current_user_code', true) 
  AND is_admin = true
));

CREATE POLICY "Admins can delete time sessions" 
ON public.time_sessions 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE code = current_setting('app.current_user_code', true) 
  AND is_admin = true
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_time_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_time_sessions_updated_at
BEFORE UPDATE ON public.time_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_time_sessions_updated_at();

-- Create view for user hours summary
CREATE OR REPLACE VIEW public.user_hours_summary AS
SELECT 
  p.code,
  p.name,
  p.role,
  COALESCE(SUM(ts.total_hours), 0) as total_hours,
  COUNT(CASE WHEN ts.is_flagged THEN 1 END) as flagged_sessions,
  MAX(ts.updated_at) as last_activity
FROM profiles p
LEFT JOIN time_sessions ts ON p.code = ts.user_code AND ts.check_out_time IS NOT NULL
GROUP BY p.code, p.name, p.role
ORDER BY total_hours DESC;