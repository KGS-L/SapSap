import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceAdminService } from '../../../core/services/finance-admin.service';
import { MobileMoneyProvider } from '../../../core/models/finance.model';

@Component({
  selector: 'app-finances-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './finances-dashboard.component.html',
  styleUrl: './finances-dashboard.component.css'
})
export class FinancesDashboardComponent implements OnInit {
  readonly financeService = inject(FinanceAdminService);

  activeTab = signal<'withdrawals' | 'ledger'>('withdrawals');
  providerFilter = signal<'all' | 'orange_money' | 'moov_money'>('all');

  ngOnInit(): void {
    this.financeService.loadStats().subscribe();
    this.financeService.loadWithdrawals().subscribe();
    this.financeService.loadLedger().subscribe();
  }

  setTab(tab: 'withdrawals' | 'ledger'): void {
    this.activeTab.set(tab);
  }

  setProviderFilter(provider: 'all' | 'orange_money' | 'moov_money'): void {
    this.providerFilter.set(provider);
  }

  get filteredWithdrawals() {
    const filter = this.providerFilter();
    const list = this.financeService.withdrawals();
    if (filter === 'all') return list;
    return list.filter(w => w.provider === filter);
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }

  formatDateTime(dateStr?: string | null): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  getProviderName(provider: MobileMoneyProvider): string {
    switch (provider) {
      case 'orange_money': return 'Orange Money';
      case 'moov_money': return 'Moov Money';
      case 'telecel': return 'Telecel Cash';
      default: return provider;
    }
  }

  getTypeLabel(type: string): { label: string; cssClass: string } {
    switch (type) {
      case 'mission_earning': return { label: 'Gain Mission', cssClass: 'badge-success' };
      case 'withdrawal_debit': return { label: 'Retrait Mobile Money', cssClass: 'badge-warning' };
      case 'withdrawal_refund': return { label: 'Remboursement', cssClass: 'badge-info' };
      case 'bonus': return { label: 'Bonus Fidélité', cssClass: 'badge-primary' };
      default: return { label: type, cssClass: 'badge-secondary' };
    }
  }
}
