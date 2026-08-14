import { ChangeEvent, useMemo, useState } from 'react';
import clsx from 'clsx';

import { useCreditHoldMessage, useLoggedUser } from 'hooks/index';
import { DangerIcon, QuestionIcon } from 'icons/index';
import { useShopperContext } from 'providers/index';
import type { ShopperOrganization } from 'providers/shopperContext';
import { Button } from 'ui/index';

type ShoppingContextType = 'myself' | 'organization';

const DEFAULT_SUPPORT_HREF = 'mailto:membersupport@isc2.org';

const RADIO_CLASS =
  'h-4 w-4 cursor-pointer border-black-100 checked:border-isc2-green bg-white-00 text-isc2-green focus:ring-isc2-green';

export type ShopperContextModalContentProps = {
  organizations: ShopperOrganization[];
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ShopperContextModalContent({
  organizations,
  onConfirm,
  onCancel,
}: ShopperContextModalContentProps) {
  const { user } = useLoggedUser();
  const { setShopperContext } = useShopperContext();
  const creditHoldMessage = useCreditHoldMessage();

  const userDisplayName = useMemo(() => {
    if (user?.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }

    return user?.fullName?.trim() || 'there';
  }, [user?.firstName, user?.lastName, user?.fullName]);

  const [selectedType, setSelectedType] = useState<ShoppingContextType>('myself');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(organizations[0]?.id ?? '');

  const selectedOrganization = useMemo(
    () => organizations.find((item) => item.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId]
  );

  const isOrganizationOnCreditHold =
    selectedType === 'organization' && Boolean(selectedOrganization?.creditHold);

  const canConfirm =
    selectedType === 'myself' ||
    (selectedType === 'organization' &&
      Boolean(selectedOrganizationId) &&
      !isOrganizationOnCreditHold);

  const handleOrganizationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedOrganizationId(event.target.value);
  };

  const handleConfirm = () => {
    if (selectedType === 'myself') {
      setShopperContext({ type: 'myself', organization: null });
      onConfirm();
      return;
    }

    if (isOrganizationOnCreditHold) {
      return;
    }

    setShopperContext({ type: 'organization', organization: selectedOrganization });
    onConfirm();
  };

  return (
    <div className="flex flex-col justify-center items-center mx-5">
      <div className="bg-white-00 rounded-lg w-full sm:w-[80vw] sm:max-w-lg h-min max-h-[80dvh] mt-8 overflow-auto">
        <div
          tabIndex={0}
          className="flex flex-col p-8 sm:p-10 text-black-100 gap-y-5 leading-23 overflow-auto"
        >
          <div className="space-y-2">
            <h4 id="modal-title" className="text-lg sm:text-2xl font-normal">
              Welcome Back, {userDisplayName}
            </h4>
            <p id="modal-description" className="text-sm text-gray-70">
              Who are you shopping for today?
            </p>
          </div>

          <fieldset className="flex flex-col gap-y-4" aria-labelledby="modal-description">
            <legend className="sr-only">Shopping context</legend>

            <label className="flex items-center gap-x-3 cursor-pointer w-fit">
              <input
                type="radio"
                name="shopping-context"
                value="myself"
                checked={selectedType === 'myself'}
                onChange={() => setSelectedType('myself')}
                className={RADIO_CLASS}
              />
              <span className="body-m text-sm">Myself</span>
            </label>

            <label className="flex items-center gap-x-3 cursor-pointer w-fit">
              <input
                type="radio"
                name="shopping-context"
                value="organization"
                checked={selectedType === 'organization'}
                onChange={() => setSelectedType('organization')}
                className={RADIO_CLASS}
              />
              <span className="body-m text-sm">My Organization</span>
            </label>
          </fieldset>

          {selectedType === 'organization' && (
            <div className="w-full space-y-1">
              <label className="body-s text-black" htmlFor="shopper-organization">
                Organization
              </label>
              <select
                id="shopper-organization"
                value={selectedOrganizationId}
                onChange={handleOrganizationChange}
                className={clsx(
                  'border h-13 rounded-lg w-full text-black-100 px-3 body-s outline-isc2-green',
                  'focus:ring-isc2-green focus:border-isc2-green border-isc2-green'
                )}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>

              {isOrganizationOnCreditHold && (
                <div
                  role="alert"
                  className="flex items-start gap-x-3 rounded-md bg-red-error/10 px-4 py-3 text-xs sm:text-sm text-red-error mt-2"
                >
                  <DangerIcon size={20} className="shrink-0 mt-0.5" />
                  <p>{creditHoldMessage}</p>
                </div>
              )}
            </div>
          )}

          {selectedType === 'organization' && (
            <div className="flex items-start gap-x-3 rounded-md bg-gray-10 px-4 py-3 text-xs sm:text-sm text-gray-90">
              <QuestionIcon size={20} className="shrink-0 mt-0.5 text-gray-70" />
              <p>
                Missing an organization? Please contact your sales representative or{' '}
                <a
                  href={DEFAULT_SUPPORT_HREF}
                  className="text-link-blue underline hover:no-underline"
                >
                  reach out to our support team
                </a>
                .
              </p>
            </div>
          )}

          <div className="flex justify-center items-center gap-x-6 mt-2">
            <button
              type="button"
              aria-label="Cancel"
              className="body-m text-sm text-black-100 hover:underline"
              onClick={onCancel}
            >
              Cancel
            </button>
            <Button
              variant="primary"
              label="Confirm Shopper"
              disabled={!canConfirm}
              onClick={handleConfirm}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
