import { canAllocateAmfAgain, isAmfAllocation, isRemainingAllocationUser } from './allocations';
import { AllocationUser } from 'types/profile';

jest.mock('providers/index', () => ({}));
jest.mock('hooks/index', () => ({}));

const redeemedUser = {
  isRedeemed: true,
  isCancelled: false,
  isExpired: false,
  isFailedToAllocate: false,
};

describe('AMF repeat allocation', () => {
  it('recognises an annual maintenance fee by name, sku, or key', () => {
    expect(isAmfAllocation({ name: 'Annual Maintenance Fee Professional' })).toBe(true);
    expect(isAmfAllocation({ name: 'Membership', sku: 'AMF-PRO' })).toBe(true);
    expect(isAmfAllocation({ name: 'Membership', key: 'pt-amf' })).toBe(true);
    expect(isAmfAllocation({ name: 'CISSP Training', sku: 'EDU-TRN' })).toBe(false);
  });

  it('allows a redeemed AMF user to be allocated again from the same order', () => {
    expect(
      canAllocateAmfAgain(redeemedUser, {
        name: 'Annual Maintenance Fee Professional',
        expired: false,
      })
    ).toBe(true);
  });

  it('does not allow a second allocation for a non-AMF product', () => {
    expect(
      canAllocateAmfAgain(redeemedUser, { name: 'CISSP Training', sku: 'EDU-TRN', expired: false })
    ).toBe(false);
  });

  it('does not allow another AMF allocation when the user or the order cannot take one', () => {
    const amf = { name: 'Annual Maintenance Fee Professional', expired: false };

    expect(canAllocateAmfAgain({ ...redeemedUser, isCancelled: true }, amf)).toBe(false);
    expect(canAllocateAmfAgain({ ...redeemedUser, isExpired: true }, amf)).toBe(false);
    expect(canAllocateAmfAgain({ ...redeemedUser, isFailedToAllocate: true }, amf)).toBe(false);
    expect(canAllocateAmfAgain({ ...redeemedUser, isRedeemed: false }, amf)).toBe(false);
    expect(canAllocateAmfAgain(redeemedUser, { ...amf, expired: true })).toBe(false);
  });

  it('shows the same redeemed AMF user on the remaining list so Allocate is available', () => {
    const endUser = {
      firstName: 'End',
      lastName: 'User',
      email: 'htest7.7.26.1.dev@iscqa.testinator.com',
      isRedeemed: true,
      isAllocated: true,
      isAccepted: true,
    } as AllocationUser;
    const amfOrder = {
      name: 'Annual Maintenance Fee Professional',
      expired: false,
      allocationSummary: { available: 8 },
    };
    const remaining = [endUser].filter((user) => isRemainingAllocationUser(user, amfOrder));
    const search = 'htest7.7.26.1.dev@iscqa.testinator.com';
    const matches = remaining.filter((user) => user.email.includes(search));

    expect(matches).toEqual([endUser]);
    expect(canAllocateAmfAgain(endUser, amfOrder) && amfOrder.allocationSummary.available > 0).toBe(
      true
    );
  });

  it('keeps a redeemed non-AMF user off the remaining list', () => {
    const endUser = {
      firstName: 'End',
      lastName: 'User',
      email: 'learner@example.com',
      isRedeemed: true,
    } as AllocationUser;

    expect(
      isRemainingAllocationUser(endUser, { name: 'CISSP Training', sku: 'EDU-TRN', expired: false })
    ).toBe(false);
  });

  it('keeps a user who has not been allocated on the remaining list', () => {
    const endUser = {
      firstName: 'End',
      lastName: 'User',
      email: 'new@example.com',
      isAvailableToAllocate: true,
    } as AllocationUser;

    expect(
      isRemainingAllocationUser(endUser, { name: 'CISSP Training', sku: 'EDU-TRN', expired: false })
    ).toBe(true);
  });
});
