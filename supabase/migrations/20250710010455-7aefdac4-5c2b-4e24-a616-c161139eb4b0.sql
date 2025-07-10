
-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create competition_settings table
CREATE TABLE public.competition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_date DATE,
  team_member_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  assigned_to TEXT,
  due_date DATE,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scouting_data table
CREATE TABLE public.scouting_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_number TEXT NOT NULL,
  match_number TEXT NOT NULL,
  scouted_by TEXT NOT NULL,
  auto_points_scored INTEGER DEFAULT 0,
  teleop_points_scored INTEGER DEFAULT 0,
  climbed BOOLEAN DEFAULT false,
  parked BOOLEAN DEFAULT false,
  auto_notes TEXT DEFAULT '',
  teleop_notes TEXT DEFAULT '',
  defense_rating INTEGER DEFAULT 3 CHECK (defense_rating >= 1 AND defense_rating <= 5),
  driver_skill_rating INTEGER DEFAULT 3 CHECK (driver_skill_rating >= 1 AND driver_skill_rating <= 5),
  robot_reliability_rating INTEGER DEFAULT 3 CHECK (robot_reliability_rating >= 1 AND robot_reliability_rating <= 5),
  general_notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouting_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for announcements (anyone can read, admins can modify)
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);

-- Create RLS policies for competition_settings (anyone can read, admins can modify)
CREATE POLICY "Anyone can view competition settings" ON public.competition_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert competition settings" ON public.competition_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);
CREATE POLICY "Admins can update competition settings" ON public.competition_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);
CREATE POLICY "Permanent admin can delete competition settings" ON public.competition_settings FOR DELETE USING (
  current_setting('app.current_user_code', true) = '10101'
);

-- Create RLS policies for tasks (anyone can read and update completion, admins can insert/delete)
CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Admins can insert tasks" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);
CREATE POLICY "Anyone can update task completion" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);

-- Create RLS policies for scouting_data (anyone can read and insert, admins can delete)
CREATE POLICY "Anyone can view scouting data" ON public.scouting_data FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scouting data" ON public.scouting_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete scouting data" ON public.scouting_data FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);

-- Insert a default competition settings record
INSERT INTO public.competition_settings (competition_date, team_member_count) 
VALUES ('2024-03-15', 0);
