export type UserRole = 'super-admin' | 'validator' | 'company-admin' | 'company-viewer' | 'user';

export interface User {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  roles?: string[];
  permissions?: string[];
  reputation_score?: number;
  city?: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  errors?: Record<string, string[]>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
