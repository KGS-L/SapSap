export interface User {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email?: string;
  district?: string;
  city?: string;
  reputation_score: number;
  completed_missions_count?: number;
  created_at?: string;
  roles?: string[];
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    phone_number: string;
    reputation_score: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

export interface OtpRequestPayload {
  phone_number: string;
}

export interface OtpVerifyPayload {
  phone_number: string;
  otp_code: string;
}
