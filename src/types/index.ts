
export interface User {
  code: string;
  name: string;
  role: string;
  isAdmin: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ProgressTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assigned_to?: string;
  due_date?: string;
  category: string;
}

export interface ScoutingData {
  id: string;
  team_number: string;
  match_number: string;
  scouted_by: string;
  created_at: string;
  auto_points_scored: number;
  teleop_points_scored: number;
  climbed: boolean;
  parked: boolean;
  auto_notes: string;
  teleop_notes: string;
  defense_rating: number;
  driver_skill_rating: number;
  robot_reliability_rating: number;
  general_notes: string;
}

export interface CompetitionSettings {
  id: string;
  competition_date?: string;
  team_member_count: number;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}
