/**
 * @jest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import ShopperContextModalContent from 'components/ShopperContext/ShopperContextModalContent';
import { fetchB2BLabels } from 'providers/b2bLabels';
import { emptyB2BLabelGroups } from 'types/b2bLabels';

const mockPush = jest.fn();
const mockSetShopperContext = jest.fn();
let mockAsPath = '/some/page?x=1#top';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, asPath: mockAsPath }),
}));
jest.mock('hooks/index', () => ({
  useLoggedUser: () => ({ user: { firstName: 'Sam', lastName: 'Test' } }),
  useCreditHoldMessage: () => 'On credit hold',
}));
jest.mock('providers/index', () => ({
  useShopperContext: () => ({ setShopperContext: mockSetShopperContext }),
}));
jest.mock('providers/b2bLabels', () => ({ fetchB2BLabels: jest.fn() }));
jest.mock('icons/index', () => ({ DangerIcon: () => null, QuestionIcon: () => null }));
jest.mock('ui/index', () => ({
  Button: ({
    label,
    onClick,
    disabled,
  }: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockFetchLabels = fetchB2BLabels as jest.Mock;

const orgs = [
  { id: 'a', name: 'Acme', creditHold: false },
  { id: 'b', name: 'Held Co', creditHold: true },
] as never[];

const labelsWithLink = (url?: string) => {
  const groups = emptyB2BLabelGroups();
  if (url) groups.shopperContext = { postSelectionLinkUrl: url };
  return groups;
};

let container: HTMLDivElement;
let root: Root;

const renderModal = async () => {
  const onConfirm = jest.fn();
  await act(async () => {
    root.render(<ShopperContextModalContent organizations={orgs} onConfirm={onConfirm} />);
  });
  return onConfirm;
};

const radio = (value: string) =>
  container.querySelector(`input[type="radio"][value="${value}"]`) as HTMLInputElement;
const confirmButton = () =>
  Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent === 'Confirm Shopper'
  ) as HTMLButtonElement;

const chooseOrganization = () =>
  act(async () => {
    radio('organization').click();
  });
const confirm = () =>
  act(async () => {
    confirmButton().click();
  });
const settle = () =>
  act(async () => {
    await null;
  });

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  mockAsPath = '/some/page?x=1#top';
  mockFetchLabels.mockResolvedValue(labelsWithLink('/b2b-product-categories'));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('ShopperContextModalContent post-selection redirect', () => {
  it('redirects to the authored link after an organization is confirmed', async () => {
    const onConfirm = await renderModal();
    await chooseOrganization();
    await confirm();
    await settle();

    expect(mockSetShopperContext).toHaveBeenCalledWith({
      type: 'organization',
      organization: orgs[0],
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/b2b-product-categories');
  });

  it('does not redirect when "Myself" is confirmed', async () => {
    const onConfirm = await renderModal();
    await confirm();
    await settle();

    expect(mockSetShopperContext).toHaveBeenCalledWith({ type: 'myself', organization: null });
    expect(onConfirm).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not redirect when no link is authored', async () => {
    mockFetchLabels.mockResolvedValue(labelsWithLink());
    await renderModal();
    await chooseOrganization();
    await confirm();
    await settle();

    expect(mockSetShopperContext).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not redirect when the labels fetch resolves to empty groups (failure path)', async () => {
    mockFetchLabels.mockResolvedValue(emptyB2BLabelGroups());
    await renderModal();
    await chooseOrganization();
    await confirm();
    await settle();

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('skips the push when already on the destination, ignoring query and hash', async () => {
    mockAsPath = '/b2b-product-categories?utm=1#grid';
    await renderModal();
    await chooseOrganization();
    await confirm();
    await settle();

    expect(mockSetShopperContext).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('blocks confirm and never redirects for an organization on credit hold', async () => {
    const onConfirm = await renderModal();
    await chooseOrganization();
    await act(async () => {
      const select = container.querySelector('#shopper-organization') as HTMLSelectElement;
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(select, 'b');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(confirmButton().disabled).toBe(true);
    await confirm();
    await settle();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('fetches the labels once, on open', async () => {
    await renderModal();
    expect(mockFetchLabels).toHaveBeenCalledTimes(1);
  });
});
