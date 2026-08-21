import { BUSINESS_PAYMENT_METHODS } from 'constants/checkout';

import {
  amountDueWithPrepaid,
  isBusinessPaymentMethodEligible,
  isCreditPreapproved,
  isPreapprovedCreditEligible,
  isPrepaidAccountEligible,
  isPrepaidDiscountType,
  isPrepaidUnexpired,
  prepaidDiscountValue,
  resolvePrepaidDiscount,
  type PaymentEligibilityAccount,
} from './paymentEligibility';

const today = new Date(2026, 7, 18);

const eligibleAccount = (): PaymentEligibilityAccount => ({
  creditHold: false,
  purchaseControls: { prepaidAuthorized: true },
  credit: { paymentTerms: 'Net 30', availableCredit: 500 },
  prepaid: { expirationDate: '2026-12-31', balance: 200 },
});

describe('paymentEligibility', () => {
  describe('isPrepaidAccountEligible', () => {
    it('is true when authorized, unexpired, and balance covers the cart', () => {
      expect(isPrepaidAccountEligible(eligibleAccount(), 200, today)).toBe(true);
    });

    it('is true when balance exactly matches the cart', () => {
      expect(isPrepaidAccountEligible(eligibleAccount(), 200, today)).toBe(true);
    });

    it('is false without a prepaid object', () => {
      const account = eligibleAccount();
      delete account.prepaid;
      expect(isPrepaidAccountEligible(account, 50, today)).toBe(false);
    });

    it('is false when the buyer is not prepaid-authorized', () => {
      const account = eligibleAccount();
      account.purchaseControls = { prepaidAuthorized: false };
      expect(isPrepaidAccountEligible(account, 50, today)).toBe(false);
    });

    it('is false when prepaid expired before today', () => {
      const account = eligibleAccount();
      account.prepaid = { expirationDate: '2026-08-17', balance: 500 };
      expect(isPrepaidAccountEligible(account, 50, today)).toBe(false);
    });

    it('is true when prepaid expires today', () => {
      expect(isPrepaidUnexpired('2026-08-18', today)).toBe(true);
      const account = eligibleAccount();
      account.prepaid = { expirationDate: '2026-08-18', balance: 50 };
      expect(isPrepaidAccountEligible(account, 50, today)).toBe(true);
    });

    it('is false when balance is below the cart total', () => {
      expect(isPrepaidAccountEligible(eligibleAccount(), 201, today)).toBe(false);
    });

    it('uses cart plus tax minus discount when discountPercentage is greater than 0', () => {
      const account = eligibleAccount();
      account.prepaid = {
        expirationDate: '2026-12-31',
        balance: 90,
        type: 'Investment',
        discountPercentage: 10,
      };
      expect(isPrepaidAccountEligible(account, 100, today)).toBe(true);
      expect(isPrepaidAccountEligible(account, 101, today)).toBe(false);
    });

    it('uses the same discounted compare for deposit prepaid', () => {
      const account = eligibleAccount();
      account.prepaid = {
        expirationDate: '2026-12-31',
        balance: 90,
        type: 'Deposit',
        discountPercentage: 10,
      };
      expect(isPrepaidAccountEligible(account, 100, today)).toBe(true);
      account.prepaid.discountPercentage = 0;
      expect(isPrepaidAccountEligible(account, 100, today)).toBe(false);
    });
  });

  describe('isPreapprovedCreditEligible', () => {
    it('is true when not on hold, terms are not Due on Receipt, and credit covers the cart', () => {
      expect(isPreapprovedCreditEligible(eligibleAccount(), 500)).toBe(true);
    });

    it('is false on credit hold', () => {
      const account = eligibleAccount();
      account.creditHold = true;
      expect(isPreapprovedCreditEligible(account, 50)).toBe(false);
    });

    it('is false when payment terms are Due on Receipt', () => {
      expect(isCreditPreapproved('Due on Receipt')).toBe(false);
      const account = eligibleAccount();
      account.credit = { paymentTerms: 'Due on Receipt', availableCredit: 5000 };
      expect(isPreapprovedCreditEligible(account, 50)).toBe(false);
    });

    it('is false when available credit is missing or below the cart', () => {
      const account = eligibleAccount();
      account.credit = { paymentTerms: 'Net 30', availableCredit: 49 };
      expect(isPreapprovedCreditEligible(account, 50)).toBe(false);
    });

    it('uses creditLimit when live availableCredit is null', () => {
      const account = eligibleAccount();
      account.credit = {
        paymentTerms: 'Net 30',
        availableCredit: null,
        creditLimit: 25000,
        creditBalance: null,
      };
      expect(isPreapprovedCreditEligible(account, 100)).toBe(true);
      expect(isPreapprovedCreditEligible(account, 25001)).toBe(false);
    });

    it('subtracts creditBalance from creditLimit when availableCredit is absent', () => {
      const account = eligibleAccount();
      account.credit = {
        paymentTerms: 'Net 30',
        availableCredit: null,
        creditLimit: 25000,
        creditBalance: 24000,
      };
      expect(isPreapprovedCreditEligible(account, 1001)).toBe(false);
      expect(isPreapprovedCreditEligible(account, 1000)).toBe(true);
    });

    it('does not fall back to creditLimit when availableCredit is explicitly 0', () => {
      const account = eligibleAccount();
      account.credit = {
        paymentTerms: 'Net 30',
        availableCredit: 0,
        creditLimit: 25000,
      };
      expect(isPreapprovedCreditEligible(account, 1)).toBe(false);
    });
  });

  describe('live OTP accountContactRelations shape', () => {
    const liveOtpAccount = (): PaymentEligibilityAccount => ({
      creditHold: false,
      purchaseControls: { prepaidAuthorized: null },
      credit: {
        paymentTerms: 'Net 30',
        creditLimit: 25000,
        creditBalance: null,
        availableCredit: null,
      },
      prepaid: {
        expirationDate: '2026-12-31',
        balance: 15000,
        type: 'Investment',
        discountPercentage: 10,
      },
    });

    it('hides prepaid when authorization is still null', () => {
      expect(isPrepaidAccountEligible(liveOtpAccount(), 1, today)).toBe(false);
    });

    it('reads discountPercentage but does not apply it when authorization is null', () => {
      expect(resolvePrepaidDiscount(liveOtpAccount().prepaid)).toBe(10);
    });

    it('offers preapproved credit from Net 30 terms and creditLimit', () => {
      expect(isPreapprovedCreditEligible(liveOtpAccount(), 100)).toBe(true);
    });

    it('hides preapproved credit when the relation is on credit hold', () => {
      const held = liveOtpAccount();
      held.creditHold = true;
      held.credit = {
        paymentTerms: 'Net 60',
        creditLimit: 10000,
        creditBalance: null,
        availableCredit: null,
      };
      expect(isPreapprovedCreditEligible(held, 1)).toBe(false);
    });
  });

  describe('isBusinessPaymentMethodEligible', () => {
    it('routes prepaid and credit methods', () => {
      expect(
        isBusinessPaymentMethodEligible(
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
          eligibleAccount(),
          200,
          today
        )
      ).toBe(true);
      expect(
        isBusinessPaymentMethodEligible(
          BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
          eligibleAccount(),
          500
        )
      ).toBe(true);
    });
  });

  describe('prepaid discount', () => {
    it('applies discountPercentage for investment and deposit prepaid', () => {
      expect(isPrepaidDiscountType('Investment')).toBe(true);
      expect(isPrepaidDiscountType('deposit')).toBe(true);
      expect(isPrepaidDiscountType('Other')).toBe(false);
      expect(
        resolvePrepaidDiscount({
          type: 'Investment',
          discountPercentage: 10,
          expirationDate: null,
          balance: null,
        })
      ).toBe(10);
      expect(
        resolvePrepaidDiscount({
          type: 'Deposit',
          discountPercentage: 15,
          expirationDate: null,
          balance: null,
        })
      ).toBe(15);
      expect(
        resolvePrepaidDiscount({
          type: 'Other',
          discountPercentage: 10,
          expirationDate: null,
          balance: null,
        })
      ).toBeNull();
    });

    it('treats null and 0 discountPercentage as no discount', () => {
      expect(
        resolvePrepaidDiscount({
          type: 'Investment',
          discountPercentage: null,
          expirationDate: null,
          balance: null,
        })
      ).toBeNull();
      expect(
        resolvePrepaidDiscount({
          type: 'Deposit',
          discountPercentage: 0,
          expirationDate: null,
          balance: null,
        })
      ).toBeNull();
    });

    it('reduces the prepaid amount due by cart plus tax minus discount', () => {
      expect(
        prepaidDiscountValue(100, {
          type: 'Investment',
          discountPercentage: 10,
          expirationDate: null,
          balance: null,
        })
      ).toBe(10);
      expect(
        amountDueWithPrepaid(100, {
          type: 'Investment',
          discountPercentage: 10,
          expirationDate: null,
          balance: null,
        })
      ).toBe(90);
    });
  });
});
