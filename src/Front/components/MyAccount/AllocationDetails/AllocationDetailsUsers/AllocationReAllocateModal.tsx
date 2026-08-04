import { useModal } from 'providers/index';

const MAIN_BUTTON_CLASSES = 'primary-cta text-xsm leading-20 tracking-link px-8 mt-8 mr-8 relative';

type AllocationReAllocateModalProps = {
  onConfirm: () => void;
  userName: string;
  heading?: string;
  description?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
};

export default function AllocationReAllocateModal({
  onConfirm,
  userName,
  heading = 'Re-Allocate',
  description = 'Are you sure you want to move this allocation back to available? This will allow you to re-allocate to the same person or someone else.',
  primaryCtaLabel = 'Re-Allocate',
  secondaryCtaLabel = 'Cancel',
}: AllocationReAllocateModalProps) {
  const { closeModal } = useModal();

  return (
    <div className="m-auto max-h-full flex justify-center items-center">
      <div className="bg-white-00 rounded-lg py-2">
        <div className="px-12 py-12 text-black-100 text-xsm leading-23 w-[27.625rem] max-w-[90vw] max-h-[90vh] overflow-auto">
          <h4 className="headline-s font-normal">{heading}</h4>
          <div className="mt-4 body-m">
            <p>
              <strong>{userName}</strong>
            </p>
            <p className="mt-2">{description}</p>
          </div>
          <div className="flex flex-wrap items-center">
            <button
              type="button"
              className={MAIN_BUTTON_CLASSES}
              onClick={() => {
                onConfirm();
                closeModal();
              }}
            >
              {primaryCtaLabel}
            </button>
            <button
              type="button"
              className="tertiary-cta text-xsm leading-20 tracking-link py-2 mt-8"
              onClick={closeModal}
              aria-label="Close modal"
            >
              {secondaryCtaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
