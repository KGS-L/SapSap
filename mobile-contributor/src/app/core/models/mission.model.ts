export type MissionType = 'price_check' | 'presence_audit' | 'mystery_shopper' | 'general';
export type MissionStatus = 'available' | 'assigned' | 'submitted' | 'validated' | 'rejected';

export interface CampaignSummary {
  id: number;
  title: string;
  location_city: string;
}

export interface MissionQuestion {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
}

export interface Mission {
  id: number;
  campaign_id: number;
  title: string;
  description?: string;
  mission_type?: MissionType;
  category?: string;
  reward_amount: number;
  payout_amount?: number;
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  radius_meters: number;
  required_photos_count: number;
  status: MissionStatus;
  assigned_user_id?: number | null;
  assigned_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  distance_km?: number;
  distance_meters?: number;
  campaign?: CampaignSummary;
  guidelines?: string[];
  sample_photo_urls?: string[];
  questions?: MissionQuestion[];
}

export interface ReservationResponse {
  mission_id: number;
  title: string;
  status: 'assigned';
  assigned_at: string;
  expires_at: string;
  lock_duration_minutes: number;
}

export interface SubmissionPayload {
  latitude: number;
  longitude: number;
  answers: Record<string, any>;
  photo_urls: string[];
  device_id?: string;
}

export interface SubmissionResponse {
  submission_id: number;
  mission_id: number;
  status: 'pending_review' | 'validated' | 'rejected';
  distance_from_target_meters: number;
  submission_hash: string;
}

export interface SubmissionItem {
  id: number;
  mission_id: number;
  mission_title?: string;
  reward_amount?: number;
  status: 'pending_review' | 'validated' | 'rejected';
  submitted_at: string;
  distance_from_target_meters: number;
  photos_count: number;
  rejection_reason?: string;
  auto_validation_deadline?: string;
}
