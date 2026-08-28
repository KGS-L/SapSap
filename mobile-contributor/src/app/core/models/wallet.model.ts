export type PaymentMethod = 'orange_money' | 'moov_money' | 'telecel';

export interface WalletTransaction {
  id: number;
  user_id: number;
  transaction_type: 'contributor_payout' | 'withdrawal' | 'deposit';
  type?: string;
  amount: number;
  balance_before?: number;
  balance_after?: number;
  payment_method?: PaymentMethod | string;
  payment_reference?: string;
  status: 'completed' | 'pending' | 'released' | 'failed';
  created_at: string;
  metadata?: {
    phone_number?: string;
    mission_id?: number;
    mission_title?: string;
    payout_message?: string;
    [key: string]: any;
  };
}

export interface WalletBalanceData {
  available_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
  transactions: WalletTransaction[];
}

export interface WithdrawalPayload {
  amount: number;
  payment_method: PaymentMethod;
  phone_number: string;
}

export interface WithdrawalResponse {
  transaction_id: number;
  amount_withdrawn: number;
  new_available_balance: number;
  payment_reference: string;
  status: string;
}
