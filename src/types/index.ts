
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
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface ProgressTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: Date;
  category: string;
}

export interface ScoutingData {
  id: string;
  teamNumber: string;
  matchNumber: string;
  scoutedBy: string;
  timestamp: Date;
  auto: {
    mobility: boolean;
    speakerScored: number;
    ampScored: number;
    notes: string;
  };
  teleop: {
    speakerScored: number;
    ampScored: number;
    trapScored: number;
    climbed: boolean;
    parked: boolean;
    notes: string;
  };
  overall: {
    defense: number; // 1-5 scale
    driverSkill: number; // 1-5 scale
    robotReliability: number; // 1-5 scale
    generalNotes: string;
  };
}

export interface AuthContextType {
  user: User | null;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}
