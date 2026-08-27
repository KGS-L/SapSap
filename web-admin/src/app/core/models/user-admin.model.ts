export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'super-admin' | 'validator' | 'company-admin' | 'company-viewer' | 'contributor';
  roles: string[];
  role_label: string;
  reputation_score: number;
  completed_missions_count: number;
  city: string;
  district?: string;
  is_active: boolean;
  created_at?: string;
  last_login?: string;
}

export interface UserCounts {
  total: number;
  super_admins: number;
  validators: number;
  companies: number;
  contributors: number;
  active: number;
}

export interface UserListResponse {
  success: boolean;
  data: AdminUserItem[];
  counts: UserCounts;
}

export interface UserDetailResponse {
  success: boolean;
  data: AdminUserItem;
  message?: string;
}
