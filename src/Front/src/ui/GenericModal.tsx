import { CloseIcon } from 'icons/index';
import { useModal } from 'providers/index';

import RichTextUI from './RichTextUI';
import { Button } from './Button';

export namespace GenericModal {
  export type Props = {
    heading?: string;
    description?: string;
    caption?: string;
    primaryCtaLabel?: string;
    onPrimaryCtaClick?: () => void;
    secondaryCtaLabel?: string;
    onSecondaryCtaClick?: () => void;
    isSubmitting?: boolean;
    showCloseButton?: boolean;
  };
}

export const GenericModal = (props: GenericModal.Props) => {
  const { closeModal } = useModal();

  const onPrimaryClick = () => {
    if (props.isSubmitting) {
      return;
    }

    if (props.onPrimaryCtaClick) {
      return props.onPrimaryCtaClick();
    }

    closeModal();
  };

  const onSecondaryClick = () => {
    if (props.isSubmitting) {
      return;
    }

    if (props.onSecondaryCtaClick) {
      return props.onSecondaryCtaClick();
    }

    closeModal();
  };

  return (
    <div className="generic-modal flex flex-col justify-center items-center mx-5">
      {props.showCloseButton && (
        <button
          aria-label="Close modal"
          className="py-1 px-2 self-end rounded-full bg-white-00 text-black-100"
          onClick={closeModal}
          disabled={props.isSubmitting}
        >
          <CloseIcon size={35} />
        </button>
      )}

      <div className="bg-white-00 rounded-lg sm:max-w-md h-min mt-8 max-h-[80dvh] overflow-y-auto">
        <div className="p-7 md:p-10 body-m text-black-100 text-xsm space-y-4 leading-23">
          {props.heading && <h4 className="headline-s font-normal">{props.heading}</h4>}
          {props.description && <RichTextUI className="body-l" value={props.description} />}
          {props.caption && <p className="eyebrow text-gray-70">{props.caption}</p>}

          <div className="flex space-x-8 !mt-8 items-center">
            {props.primaryCtaLabel && (
              <Button
                variant="primary"
                label={props.primaryCtaLabel}
                isLoading={props.isSubmitting}
                onClick={onPrimaryClick}
              />
            )}

            {props.secondaryCtaLabel && (
              <Button
                variant="secondary"
                label={props.secondaryCtaLabel}
                className="self-center"
                disabled={props.isSubmitting}
                onClick={onSecondaryClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
