import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WalletPage } from './wallet.page';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';

describe('WalletPage', () => {
  let component: WalletPage;
  let fixture: ComponentFixture<WalletPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WalletPage],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [WalletService, AuthService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(WalletPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create WalletPage', () => {
    expect(component).toBeTruthy();
  });

  it('should open withdrawal modal when balance is sufficient', () => {
    component.walletData = {
      available_balance: 3500,
      total_earned: 5000,
      total_withdrawn: 1500,
      currency: 'FCFA',
      transactions: []
    };
    component.openWithdraw();
    expect(component.showWithdrawModal).toBe(true);
  });
});
