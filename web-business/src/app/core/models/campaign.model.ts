export interface Campaign {
  id: number;
  title: string;
  company_name: string;
  description: string;
  type: string;
  city: string;
  target_neighborhoods: string;
  criteria?: string;
  missions_count: number;
  reward_per_mission: number;
  total_budget: number;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'rejected';
  approved_at?: string;
  created_at?: string;
  // Métriques calculées
  completed_missions?: number;
  submitted_missions?: number;
  reserved_missions?: number;
  available_missions?: number;
  progress_percent?: number;
  spent_budget?: number;
  remaining_budget?: number;
}

export interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  total_missions_target: number;
  total_missions_completed: number;
  total_budget_allocated: number;
  total_budget_spent: number;
}

export interface TrackingMetrics {
  total_missions: number;
  completed_missions: number;
  submitted_missions: number;
  reserved_missions: number;
  available_missions: number;
  progress_percent: number;
  spent_budget: number;
  escrow_remaining: number;
  average_gps_accuracy_m: number;
  compliance_rate_percent: number;
}

export interface NeighborhoodStat {
  neighborhood: string;
  total_points: number;
  completed_points: number;
  progress_percent: number;
}

export interface RecentActivityItem {
  id: number;
  mission_id: number;
  mission_title: string;
  location_name: string;
  contributor_name: string;
  contributor_score: number;
  status: 'submitted' | 'validated' | 'rejected' | 'auto_validated';
  gps_distance_meters?: number;
  created_at: string;
  validated_at?: string;
  photos_count: number;
}

export interface TrackingData {
  campaign: Campaign;
  metrics: TrackingMetrics;
  neighborhood_stats: NeighborhoodStat[];
  recent_activity: RecentActivityItem[];
}

export interface PointContributor {
  id: number;
  name: string;
  phone?: string;
  reputation_score: number;
}

export interface PointSubmission {
  id: number;
  status: 'submitted' | 'validated' | 'rejected' | 'auto_validated' | 'fraud_suspect';
  submitted_latitude: number;
  submitted_longitude: number;
  gps_accuracy?: number;
  gps_distance_meters?: number;
  answers?: Record<string, string>;
  photos?: string[];
  rejection_reason?: string;
  created_at: string;
  validated_at?: string;
  auto_validated_at?: string;
  contributor?: PointContributor;
}

export interface ResultPoint {
  id: number;
  campaign_id: number;
  campaign_title: string;
  title: string;
  location_name: string;
  latitude: number;
  longitude: number;
  reward: number;
  status: 'available' | 'reserved' | 'submitted' | 'validated' | 'rejected';
  reserved_at?: string;
  submitted_at?: string;
  assigned_user?: PointContributor;
  submission?: PointSubmission | null;
}

export interface ResultsMapResponse {
  success: boolean;
  campaign: {
    id: number;
    title: string;
    company_name: string;
    city: string;
    reward_per_mission: number;
    total_points: number;
    validated_points: number;
  };
  data: ResultPoint[];
}

export interface QuestionnaireField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'boolean' | 'photo';
  required: boolean;
  options?: string[];
  help_text?: string;
}

export interface CreateCampaignDto {
  title: string;
  description: string;
  mission_type: 'verification' | 'audit' | 'mystery_shopper' | 'pricing';
  location_city: string;
  target_district: string;
  questionnaire_schema: QuestionnaireField[];
  required_photos_count: number;
  total_missions_requested: number;
  reward_per_mission: number;
}

export interface PayCampaignDto {
  payment_method: 'orange_money' | 'moov_money';
  phone_number: string;
}
