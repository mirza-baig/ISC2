import clsx from 'clsx';

import { LoadingIndicator } from 'ui/index';

import { ProfileSectionProps } from '../profile.types';

export namespace ProfileSectionFooter {
  export type Props = ProfileSectionProps & {
    isSubmitting?: boolean;
  };
}

export const ProfileSectionFooter = ({
  cancelEditMode,
  cancelText,
  saveChangesText,
  isSubmitting,
}: ProfileSectionFooter.Props) => {
  const onCancelCtaClick = () => {
    if (isSubmitting) {
      return;
    }

    cancelEditMode();
  };

  return (
    <footer className="flex flex-row justify-end pt-8 space-x-3 border-t border-gray-30 !mt-8">
      <button
        disabled={isSubmitting}
        onClick={onCancelCtaClick}
        className="secondary-cta bg-white border-black"
        aria-label={cancelText}
      >
        {cancelText}
      </button>
      <button
        className="primary-cta relative !border-0"
        disabled={isSubmitting}
        type="submit"
        aria-label={saveChangesText}
      >
        <span className={clsx(isSubmitting && 'opacity-0')}>{saveChangesText}</span>
        {isSubmitting && <LoadingIndicator className="absolute inset-0 !p-0 self-center mx-auto" />}
      </button>
    </footer>
  );
};
