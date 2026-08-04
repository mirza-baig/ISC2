import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { CHECKOUT_STEPS } from 'constants/index';

import { CloseIcon } from 'icons/index';
import { useCheckoutProcess, useModal } from 'providers/index';
import { TaxErrorPopupLabels } from 'types/index';
import { RichTextUI } from 'ui/index';
import { goToTop } from 'utils/index';

export const TaxErrorModal = ({ fields }: { fields: TaxErrorPopupLabels }) => {
  const { closeModal } = useModal();
  const { setActiveStep } = useCheckoutProcess();

  const { heading, description, caption, errorMessages, retryCtaLabel } = fields;

  const onRetryCall = () => {
    setActiveStep(CHECKOUT_STEPS.PERSONAL_INFORMATION);
    goToTop();
    closeModal();
  };

  return (
    <div className="flex flex-col w-fit justify-self-center items-center mx-5">
      <div className="flex w-full justify-end">
        <button
          aria-label="Close modal"
          className="py-1 px-2 rounded-full bg-white-00 text-black-100"
          onClick={closeModal}
        >
          <CloseIcon size={35} />
        </button>
      </div>
      <div className="bg-white-00 rounded-lg sm:max-w-md h-min mt-8 max-h-[80dvh] overflow-y-auto">
        <div
          tabIndex={0}
          className="p-7 md:p-10 body-m text-black-100 text-xsm leading-23 overflow-auto"
        >
          {heading && (
            <Text
              id="modal-title"
              field={heading}
              tag="h4"
              className="headline-s font-normal mb-6"
            />
          )}
          <div id="modal-description">
            {description && <Text field={description} tag="p" className="body-l mb-14" />}
            {caption && <Text field={caption} tag="p" className="eyebrow text-gray-70 mb-4" />}
            {errorMessages?.value && (
              <RichTextUI value={errorMessages?.value} className="body-m tax-error-modal-list" />
            )}
          </div>
          {retryCtaLabel?.value && (
            <div className="flex mt-8 space-x-8 items-center">
              <button
                type="button"
                className="primary-cta text-xsm leading-20 tracking-link px-8"
                onClick={onRetryCall}
                aria-label={retryCtaLabel?.value}
              >
                {retryCtaLabel?.value}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
