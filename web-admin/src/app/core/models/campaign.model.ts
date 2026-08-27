export type CampaignStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'completed';

export interface Campaign {
  id: number;
  user_id: number;
  company_name?: string;
  title: string;
  description?: string;
  type: string;
  city: string;
  target_neighborhoods?: string;
  criteria?: string;
  missions_count: number;
  reward_per_mission: number;
  total_budget: number;
  status: CampaignStatus;
  rejection_reason?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CampaignCounts {
  total: number;
  pending: number;
  active: number;
  rejected: number;
}

export interface CampaignListResponse {
  success: boolean;
  data: Campaign[];
  counts: CampaignCounts;
}

export interface CampaignDetailResponse {
  success: boolean;
  data: Campaign;
  message?: string;
}
