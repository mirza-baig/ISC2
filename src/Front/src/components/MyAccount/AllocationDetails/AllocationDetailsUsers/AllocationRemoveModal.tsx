import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { useModal } from 'providers/index';
import { AllocationRemoveUserModalFields } from 'types/allocations';

const MAIN_BUTTON_CLASSES = 'primary-cta text-xsm leading-20 tracking-link px-8 mt-8 mr-8 relative';

type AllocationRemoveModalProps = AllocationRemoveUserModalFields & {
  onConfirm: () => void;
};

export default function AllocationRemoveModal({
  onConfirm,
  heading,
  description,
  primaryCtaLabel,
  secondaryCtaLabel,
}: AllocationRemoveModalProps) {
  const { closeModal } = useModal();

  return (
    <div className="m-auto max-h-full flex justify-center items-center">
      <div className="bg-white-00 rounded-lg py-2">
        <div className="px-12 py-12 text-black-100 text-xsm leading-23 w-[27.625rem] max-w-[90vw] max-h-[90vh] overflow-auto">
          {heading?.value && <Text tag="h4" className="headline-s font-normal" field={heading} />}
          {description?.value && (
            <Text tag="div" field={description} className="mt-4 body-m popup-rich-text" />
          )}
          <div className="flex flex-wrap items-center">
            {primaryCtaLabel?.value && (
              <button
                type="button"
                className={MAIN_BUTTON_CLASSES}
                onClick={() => {
                  onConfirm();
                  closeModal();
                }}
              >
                {primaryCtaLabel?.value}
              </button>
            )}
            {secondaryCtaLabel?.value && (
              <button
                type="button"
                className="tertiary-cta text-xsm leading-20 tracking-link py-2 mt-8"
                onClick={closeModal}
                aria-label="Close modal"
              >
                {secondaryCtaLabel?.value}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
