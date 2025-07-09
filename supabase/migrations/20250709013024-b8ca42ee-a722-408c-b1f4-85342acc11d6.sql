
-- Create a profiles table to store user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'Team Member',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the permanent admin user
INSERT INTO public.profiles (code, name, role, is_admin) 
VALUES ('10101', 'Permanent Admin', 'Team Captain', true);

-- Create some sample users for testing
INSERT INTO public.profiles (code, name, role, is_admin) 
VALUES 
  ('12345', 'John Smith', 'Programmer', false),
  ('54321', 'Sarah Johnson', 'Designer', false);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for the profiles table
-- Allow everyone to read profiles (for login verification)
CREATE POLICY "Anyone can view profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Only admins can insert new profiles
CREATE POLICY "Admins can insert profiles" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE code = current_setting('app.current_user_code', true) 
      AND is_admin = true
    )
  );

-- Only admins can update profiles
CREATE POLICY "Admins can update profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE code = current_setting('app.current_user_code', true) 
      AND is_admin = true
    )
  );

-- Only permanent admin (10101) can delete profiles
CREATE POLICY "Only permanent admin can delete profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (
    current_setting('app.current_user_code', true) = '10101'
  );
