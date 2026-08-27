import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import {
  FinanceStats,
  FinanceStatsResponse,
  GeneralLedgerResponse,
  WalletTransaction,
  WithdrawalListResponse,
  WithdrawalRequest
} from '../models/finance.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FinanceAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/finances`;

  // Signals réactifs pour les métriques financières
  readonly stats = signal<FinanceStats>({
    total_earned_all: 32000,
    total_available_all: 24000,
    total_withdrawn: 8000,
    total_withdrawals_count: 2,
    orange_money_volume: 5000,
    moov_money_volume: 3000,
    active_wallets_count: 3,
    currency: 'FCFA'
  });

  readonly withdrawals = signal<WithdrawalRequest[]>([
    {
      id: 1,
      user_id: 1,
      wallet_id: 1,
      reference: 'WTH-20260826-001',
      amount: 5000,
      provider: 'orange_money',
      phone_number: '+226 70 12 34 56',
      status: 'completed',
      simulated_payout_id: 'OM-BF-20260826-9812A',
      processed_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      user: {
        id: 1,
        name: 'Moussa Ouédraogo',
        email: 'moussa@sapsap.bf',
        phone: '+226 70 12 34 56',
        reputation_score: 96
      }
    },
    {
      id: 2,
      user_id: 2,
      wallet_id: 2,
      reference: 'WTH-20260826-002',
      amount: 3000,
      provider: 'moov_money',
      phone_number: '+226 76 98 76 54',
      status: 'completed',
      simulated_payout_id: 'MOOV-BF-20260826-4412B',
      processed_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      user: {
        id: 2,
        name: 'Amina Sawadogo',
        email: 'amina@sapsap.bf',
        phone: '+226 76 98 76 54',
        reputation_score: 92
      }
    }
  ]);

  readonly ledger = signal<WalletTransaction[]>([
    {
      id: 1,
      wallet_id: 1,
      user_id: 1,
      type: 'mission_earning',
      amount: 3000,
      balance_before: 0,
      balance_after: 3000,
      status: 'completed',
      reference: 'TXN-20260825-001001',
      metadata: { mission_title: 'Audit Maquis Kiosque #1 (Patte d\'Oie)' },
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      user: {
        id: 1,
        name: 'Moussa Ouédraogo',
        email: 'moussa@sapsap.bf'
      }
    },
    {
      id: 2,
      wallet_id: 1,
      user_id: 1,
      type: 'withdrawal_debit',
      amount: -5000,
      balance_before: 13500,
      balance_after: 8500,
      status: 'completed',
      reference: 'TXN-20260826-001002',
      metadata: { provider: 'orange_money', phone_number: '+226 70 12 34 56' },
      created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      user: {
        id: 1,
        name: 'Moussa Ouédraogo',
        email: 'moussa@sapsap.bf'
      }
    },
    {
      id: 3,
      wallet_id: 2,
      user_id: 2,
      type: 'withdrawal_debit',
      amount: -3000,
      balance_before: 17000,
      balance_after: 14000,
      status: 'completed',
      reference: 'TXN-20260826-002001',
      metadata: { provider: 'moov_money', phone_number: '+226 76 98 76 54' },
      created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      user: {
        id: 2,
        name: 'Amina Sawadogo',
        email: 'amina@sapsap.bf'
      }
    }
  ]);

  readonly isLoading = signal<boolean>(false);

  /**
   * Charger les statistiques financières
   */
  loadStats(): Observable<FinanceStatsResponse> {
    this.isLoading.set(true);
    return this.http.get<FinanceStatsResponse>(`${this.baseUrl}/stats`).pipe(
      tap((res: FinanceStatsResponse) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of({
          success: true,
          data: this.stats()
        });
      })
    );
  }

  /**
   * Charger les demandes de retrait Mobile Money
   */
  loadWithdrawals(limit: number = 50): Observable<WithdrawalListResponse> {
    return this.http.get<WithdrawalListResponse>(`${this.baseUrl}/withdrawals?limit=${limit}`).pipe(
      tap((res: WithdrawalListResponse) => {
        if (res.success && res.data) {
          this.withdrawals.set(res.data);
        }
      }),
      catchError(() => of({
        success: true,
        data: this.withdrawals()
      }))
    );
  }

  /**
   * Charger le registre comptable
   */
  loadLedger(limit: number = 50): Observable<GeneralLedgerResponse> {
    return this.http.get<GeneralLedgerResponse>(`${this.baseUrl}/ledger?limit=${limit}`).pipe(
      tap((res: GeneralLedgerResponse) => {
        if (res.success && res.data) {
          this.ledger.set(res.data);
        }
      }),
      catchError(() => of({
        success: true,
        data: this.ledger()
      }))
    );
  }
}
