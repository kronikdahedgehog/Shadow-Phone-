export type ProfileType = 'public' | 'hidden';

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface Photo {
  id: string;
  url: string;
  timestamp: number;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  avatar: string;
}

export interface ProfileData {
  notes: Note[];
  photos: Photo[];
  messages: Message[];
  contacts: Contact[];
  wallpaper: string;
  biometricsEnabled: {
    fingerprint: boolean;
    faceId: boolean;
  };
}

export interface PhoneState {
  currentProfile: ProfileType | null;
  isLocked: boolean;
  activeData: ProfileData | null;
  lastUsedProfile: ProfileType | null; // To know which biometrics to check
}
