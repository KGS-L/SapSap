import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WalletService } from './wallet.service';
import { ApiService } from './api.service';

describe('WalletService', () => {
  let service: WalletService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WalletService, ApiService]
    });
    service = TestBed.inject(WalletService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get wallet balance and transactions', () => {
    service.getBalance().subscribe(res => {
      expect(res.success).toBe(true);
      expect(res.data.available_balance).toBe(3500);
      expect(res.data.total_earned).toBe(6500);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/wallet/balance');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      message: 'Solde récupéré.',
      data: {
        available_balance: 3500,
        total_earned: 6500,
        total_withdrawn: 3000,
        currency: 'FCFA',
        transactions: []
      }
    });
  });

  it('should send withdrawal request with minimum amount', () => {
    service.withdraw({
      amount: 1500,
      payment_method: 'orange_money',
      phone_number: '+22670000000'
    }).subscribe(res => {
      expect(res.success).toBe(true);
      expect(res.data.amount_withdrawn).toBe(1500);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/wallet/withdraw');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.amount).toBe(1500);
    req.flush({
      success: true,
      message: 'Retrait effectué avec succès.',
      data: {
        transaction_id: 10,
        amount_withdrawn: 1500,
        new_available_balance: 2000,
        payment_reference: 'TXN-123456',
        status: 'completed'
      }
    });

    const balanceReq = httpMock.expectOne('http://localhost:8080/api/v1/wallet/balance');
    expect(balanceReq.request.method).toBe('GET');
    balanceReq.flush({
      success: true,
      message: 'Solde actualisé.',
      data: {
        available_balance: 2000,
        total_earned: 6500,
        total_withdrawn: 4500,
        currency: 'FCFA',
        transactions: []
      }
    });
  });
});
