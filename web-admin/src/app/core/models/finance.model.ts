export type MobileMoneyProvider = 'orange_money' | 'moov_money' | 'telecel';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
export type TransactionType = 'mission_earning' | 'withdrawal_debit' | 'withdrawal_refund' | 'escrow_deposit' | 'bonus' | 'penalty';

export interface WalletUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  reputation_score?: number;
}

export interface Wallet {
  id: number;
  user_id: number;
  pending_balance: number;
  available_balance: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
  user?: WalletUser;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user?: WalletUser;
}

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  wallet_id: number;
  reference: string;
  amount: number;
  provider: MobileMoneyProvider;
  phone_number: string;
  status: WithdrawalStatus;
  simulated_payout_id?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  user?: WalletUser;
}

export interface FinanceStats {
  total_earned_all: number;
  total_available_all: number;
  total_withdrawn: number;
  total_withdrawals_count: number;
  orange_money_volume: number;
  moov_money_volume: number;
  active_wallets_count: number;
  currency: string;
}

export interface FinanceStatsResponse {
  success: boolean;
  data: FinanceStats;
}

export interface WithdrawalListResponse {
  success: boolean;
  data: WithdrawalRequest[];
}

export interface GeneralLedgerResponse {
  success: boolean;
  data: WalletTransaction[];
}
