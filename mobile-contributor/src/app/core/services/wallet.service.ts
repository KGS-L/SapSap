import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/auth.model';
import {
  WalletBalanceData,
  WithdrawalPayload,
  WithdrawalResponse,
  WalletTransaction
} from '../models/wallet.model';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private walletDataSubject = new BehaviorSubject<WalletBalanceData | null>(null);
  public walletData$ = this.walletDataSubject.asObservable();

  constructor(private api: ApiService) {}

  /**
   * Récupérer le solde et les statistiques du portefeuille
   */
  public getBalance(): Observable<ApiResponse<WalletBalanceData>> {
    return this.api.get<WalletBalanceData>('/wallet/balance').pipe(
      tap(res => {
        if (res.success && res.data) {
          this.walletDataSubject.next(res.data);
        }
      })
    );
  }

  /**
   * Effectuer une demande de retrait vers Mobile Money (Orange Money / Moov Money / Telecel)
   */
  public withdraw(payload: WithdrawalPayload): Observable<ApiResponse<WithdrawalResponse>> {
    return this.api.post<WithdrawalResponse>('/wallet/withdraw', {
      amount: payload.amount,
      payment_method: payload.payment_method,
      phone_number: payload.phone_number
    }).pipe(
      tap(res => {
        if (res.success) {
          // Rafraîchir le solde après le retrait
          this.getBalance().subscribe();
        }
      })
    );
  }

  /**
   * Obtenir l'historique complet des transactions
   */
  public getTransactions(): Observable<ApiResponse<{ data: WalletTransaction[] } | WalletTransaction[]>> {
    return this.api.get<any>('/wallet/transactions');
  }
}
