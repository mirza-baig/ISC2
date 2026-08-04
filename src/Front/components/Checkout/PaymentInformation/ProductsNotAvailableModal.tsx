import { useModal } from 'providers/index';

export namespace ProductsNotAvailableModal {
  export type Props = {
    heading?: string;
    description?: string;
    ctaLabel?: string;
  };
}

export const ProductsNotAvailableModal = ({
  heading,
  description,
  ctaLabel,
}: ProductsNotAvailableModal.Props) => {
  const { closeModal } = useModal();

  return (
    <div className="flex justify-center items-center px-5">
      <div className="bg-white-00 rounded-lg py-2 w-full max-w-520">
        <div className="px-12 py-12 text-black-100 text-xsm leading-23 max-w-[90vw] max-h-[90vh] overflow-auto">
          {heading && <h4 className="headline-s font-normal">{heading}</h4>}
          {description && <p className="mt-4 body-m">{description}</p>}
          {ctaLabel && (
            <div className="flex mt-8 space-x-8 items-center">
              <button
                type="button"
                aria-label={ctaLabel}
                onClick={closeModal}
                className="primary-cta !border-none relative text-xsm leading-20 tracking-link px-8"
              >
                {ctaLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
