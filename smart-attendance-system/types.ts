export interface User {
  id: string;
  name: string;
  role: string;
  registeredAt: string;
  photoBase64: string; // The reference photo
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  status: 'Present' | 'Late' | 'Excused';
  confidence: number;
  mood?: string;
}

export type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'unknown' | 'error';

export interface RecognitionResult {
  matchFound: boolean;
  matchId: string | null;
  confidence: number;
  demographics?: {
    age_range?: string;
    gender?: string;
    expression?: string;
  };
}