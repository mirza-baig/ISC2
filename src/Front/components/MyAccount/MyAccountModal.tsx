import { TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import DangerIcon from 'icons/DangerIcon';
import { ReactNode } from 'react';
import { LoadingIndicator, RichTextUI } from 'ui/index';

export namespace MyAccountModal {
  export type Props = {
    heading: TextField;
    description?: TextField;
    noticeLabel?: string;
    hasWarningIcon?: boolean;
    redirectLink?: string;
    confirmActionLabel: string;
    cancelActionLabel?: string;
    confirmAction?: () => void;
    cancelAction?: () => void;
    isLoading?: boolean;
    additionalClasses?: string;
    children?: ReactNode;
  };
}

const BUTTON_STYLES = 'w-fit mt-5 text-xs sm:text-sm-base';

export default function MyAccountModal(
  {
    heading,
    description,
    noticeLabel,
    hasWarningIcon = false,
    redirectLink,
    confirmActionLabel,
    cancelActionLabel,
    confirmAction,
    cancelAction,
    isLoading = false,
    additionalClasses,
    children,
  } = MyAccountModal.Props
) {
  return (
    <div className="flex flex-col justify-center items-center mx-5">
      <div
        className={clsx(
          'bg-white-00 rounded-lg sm:w-[80vw] h-min max-h-[80dvh] mt-8 overflow-auto',
          additionalClasses ?? 'sm:max-w-xl'
        )}
      >
        <div
          tabIndex={0}
          className="flex flex-col p-10 text-black-100 gap-y-4 leading-23 overflow-auto"
        >
          {Boolean(noticeLabel) ? (
            <div className="flex font-bold items-center gap-x-3 text-sm-base text-red-warning">
              <span>
                <DangerIcon size={20} className="!fill-red-warning" />
              </span>
              {noticeLabel}
            </div>
          ) : (
            hasWarningIcon && (
              <div className="flex font-bold items-center gap-x-3 text-sm-base">
                <DangerIcon size={40} className="!fill-white !stroke-black stroke-[0.65px]" />
              </div>
            )
          )}
          {Boolean(heading) && (
            <h4 id="modal-title" className="text-lg sm:text-2xl font-normal">
              {heading.value}
            </h4>
          )}
          {Boolean(description) && (
            <RichTextUI
              id="modal-description"
              className="text-xs sm:text-sm-base overflow-visible"
              value={description?.value?.toString()}
            />
          )}
          {Boolean(children) && children}
          {isLoading ? (
            <LoadingIndicator className="!py-0" />
          ) : (
            <div className="space-x-7">
              {Boolean(redirectLink) ? (
                <a href={redirectLink} className={clsx(BUTTON_STYLES, 'primary-cta')}>
                  {confirmActionLabel}
                </a>
              ) : (
                <button
                  aria-label={confirmActionLabel}
                  className={clsx(BUTTON_STYLES, 'primary-cta')}
                  onClick={confirmAction}
                >
                  {confirmActionLabel}
                </button>
              )}
              {Boolean(cancelAction) && (
                <button
                  aria-label={cancelActionLabel}
                  className={BUTTON_STYLES}
                  onClick={cancelAction}
                >
                  {cancelActionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
