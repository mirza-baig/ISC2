import { Field, RichTextField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { useState } from 'react';

import { CloseIcon } from 'icons/index';
import { DropLinkFieldType } from 'types/index';
import { RichTextUI } from 'ui/index';

export type AlertNotificationsProps = {
  fields: {
    alertTypes?: DropLinkFieldType;
    alertMessage: RichTextField;
    showCloseIcon: Field<boolean>;
    mainContent: RichTextField;
  };
};

const AlertNotification = ({ fields }: AlertNotificationsProps) => {
  const [hideAlert, setHideAlert] = useState<boolean>(false);

  if (!fields || hideAlert) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex sm:justify-center relative py-1 pl-8 pr-13 sm:px-13',
        fields.alertTypes?.fields.Value.value
      )}
    >
      <RichTextUI className="body-s" value={fields.alertMessage.value} />
      {fields.showCloseIcon.value && (
        <button
          className="absolute right-3 top-1.5"
          onClick={() => setHideAlert(true)}
          aria-label="Close"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
};

export default AlertNotification;
