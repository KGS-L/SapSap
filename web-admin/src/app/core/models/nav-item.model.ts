export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  badge?: string | number;
  badgeType?: 'success' | 'warning' | 'danger' | 'info' | 'purple';
  section?: string;
  exact?: boolean;
}

export interface AdminStats {
  pendingCampaigns: number;
  pendingSubmissions: number;
  fraudAlerts: number;
  activeContributors: number;
  autoValidationSchedulerActive: boolean;
  lastAutoValidationCheck: string;
}
