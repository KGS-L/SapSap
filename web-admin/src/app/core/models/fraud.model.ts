export type FraudAlertType = 'duplicate_image' | 'device_sharing' | 'gps_spoofing';
export type FraudSeverity = 'low' | 'medium' | 'high';
export type FraudStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type FraudResolutionAction = 'account_suspended' | 'score_penalized' | 'warning_issued' | 'false_positive';

export interface FraudUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  reputation_score: number;
  is_active?: boolean;
}

export interface FraudSubmission {
  id: number;
  mission_id?: number;
  status?: string;
  gps_distance_meters?: number;
  created_at?: string;
  photos?: string[];
  mission?: {
    id: number;
    title: string;
    location_name: string;
  };
}

export interface FraudAlertDetails {
  sha256_hash?: string;
  original_submission_id?: number;
  original_user_id?: number;
  original_user_name?: string;
  file_name?: string;
  file_size?: number;
  device_id?: string;
  accounts_count?: number;
  accounts?: FraudUser[];
  linked_accounts?: Array<{
    name: string;
    phone: string;
    score: number;
  }>;
  risk_factor?: string;
  distance_meters?: number;
  allowed_tolerance?: number;
  location?: string;
  accuracy?: string;
  match_percentage?: number;
  detected_at?: string;
}

export interface FraudAlert {
  id: number;
  user_id: number | null;
  submission_id: number | null;
  alert_type: FraudAlertType;
  severity: FraudSeverity;
  title: string;
  description: string | null;
  details: FraudAlertDetails | null;
  status: FraudStatus;
  resolution_action: string | null;
  resolution_note: string | null;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user?: FraudUser;
  submission?: FraudSubmission;
  resolver?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface FraudCounts {
  total: number;
  pending: number;
  duplicate_images: number;
  device_sharing: number;
  resolved: number;
}

export interface FraudAlertListResponse {
  success: boolean;
  data: FraudAlert[];
  counts: FraudCounts;
}

export interface FraudDetailResponse {
  success: boolean;
  data: FraudAlert;
  message?: string;
}
