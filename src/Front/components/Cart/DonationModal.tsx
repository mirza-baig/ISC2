import { CloseIcon } from 'icons/index';
import { useModal } from 'providers/index';
import { OptionalDonationPopupNoticeFields } from 'types/cart';
import { RichTextUI } from 'ui/index';

export const DonationModal = ({ fields }: OptionalDonationPopupNoticeFields) => {
  const { closeModal } = useModal();
  const { heading, description } = fields;

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
      <div className="bg-white-00 rounded-lg md:w-[80vw] md:max-w-8xl h-min mt-8 max-sm:max-h-[80dvh] max-sm:overflow-auto">
        <div
          tabIndex={0}
          className="px-5 py-10 md:p-20 text-black-100 text-xsm leading-23 overflow-auto"
        >
          {heading && (
            <h4 id="modal-title" className="headline-s font-normal mb-4">
              {heading.value}
            </h4>
          )}
          {description && <RichTextUI id="modal-description" value={description.value} />}
        </div>
      </div>
    </div>
  );
};
