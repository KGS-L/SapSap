export interface SchedulerLastRun {
  id: number;
  executed_at: string;
  processed_count: number;
  status: 'success' | 'warning' | 'failed';
  triggered_by: 'scheduler' | 'manual_admin';
}

export interface SchedulerStats {
  is_active: boolean;
  interval_description: string;
  auto_validation_delay_hours: number;
  pending_eligible_count: number;
  total_auto_validated_count: number;
  total_submissions_count: number;
  last_run: SchedulerLastRun | null;
  next_estimated_run: string;
}

export interface SchedulerLogItem {
  submission_id: number;
  contributor_name: string;
  mission_title: string;
  reward: number;
  submitted_at?: string;
  auto_validated_at: string;
}

export interface SchedulerLog {
  id: number;
  job_name: string;
  executed_at: string;
  processed_count: number;
  status: 'success' | 'warning' | 'failed';
  details?: {
    hours_threshold?: number;
    duration_ms?: number;
    processed_items?: SchedulerLogItem[];
    error?: string;
  };
  triggered_by: 'scheduler' | 'manual_admin';
  admin_user_id?: number | null;
  admin_user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface SchedulerStatusResponse {
  success: boolean;
  data: SchedulerStats;
}

export interface AutoValidationRunResult {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    processed_count: number;
    hours_threshold: number;
    duration_ms: number;
    log_id: number;
    executed_at: string;
    items: SchedulerLogItem[];
  };
}

export interface SchedulerLogsResponse {
  success: boolean;
  data: SchedulerLog[];
}
