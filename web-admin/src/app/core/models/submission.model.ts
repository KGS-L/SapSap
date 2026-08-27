export type SubmissionStatus = 'submitted' | 'validated' | 'rejected' | 'fraud_suspect';

export interface SubmissionUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  reputation_score: number;
}

export interface SubmissionMission {
  id: number;
  campaign_id: number;
  title: string;
  location_name: string;
  reward: number;
  latitude?: number;
  longitude?: number;
  campaign?: {
    id: number;
    title: string;
    company_name?: string;
    type: string;
    city: string;
  };
}

export interface Submission {
  id: number;
  mission_id: number;
  user_id: number;
  status: SubmissionStatus;
  answers?: Record<string, string>;
  photos?: string[];
  submitted_latitude?: number;
  submitted_longitude?: number;
  gps_accuracy: number;
  gps_distance_meters: number;
  device_id?: string;
  rejection_reason?: string | null;
  validated_at?: string | null;
  rejected_at?: string | null;
  auto_validated_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: SubmissionUser;
  mission?: SubmissionMission;
}

export interface SubmissionCounts {
  total: number;
  submitted: number;
  validated: number;
  rejected: number;
  fraud_suspect: number;
}

export interface SubmissionListResponse {
  success: boolean;
  data: Submission[];
  counts: SubmissionCounts;
}

export interface SubmissionDetailResponse {
  success: boolean;
  data: Submission;
  message?: string;
}
