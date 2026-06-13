export interface DiaryEntry {
  date: string; // YYYY-MM-DD acting as folder ID
  location: {
    name: string;
    coords: { lat: number; lng: number } | null;
  };
  feeling: string; // Emoji
  people: string[]; // List of names
  tags: string[]; // List of event hashtags
  text: string; // Journal body text
  summary: string; // AI generated summary
  secretText?: string; // Private diary details
  images?: string[]; // Base64 or mock attachment data URI strings
  audioUrl?: string; // Base64 audio or visual mock recorder info
  isOnlyMe: boolean; // Flag to wipeout on Will triggers
  createdAt: string;
}

export interface Person {
  name: string;
  relation: string; // Friend, Family, Partner, Colleague, etc.
  notes: string;
  avatar: string; // Base64 / color accent
  interactions: number;
}

export interface VisitedPlace {
  name: string;
  date: string;
  description: string;
  coords: { lat: number; lng: number };
}

export interface Goal {
  id: string;
  title: string;
  category: "Health" | "Career" | "Mind" | "Relationships" | "Legacy";
  targetDate: string;
  achieved: boolean;
  notes: string;
}

export interface WillConfig {
  beneficiaryName: string;
  beneficiaryEmail: string;
  safetyKey: string;
  lockedWillContent: string;
  inactivityDaysLimit: number; // e.g., 30 days
  lastCheckIn: string; // ISO String
}

export interface ServerState {
  entries: DiaryEntry[];
  people: Person[];
  goals: Goal[];
  will: WillConfig;
}
