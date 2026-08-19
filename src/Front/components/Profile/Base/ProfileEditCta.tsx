import { Link, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { EditIcon } from 'icons/index';

const EDIT_CTA_CLASSES = 'flex flex-row items-center space-x-2 text-link-blue';

export namespace ProfileEditCta {
  export type Props = {
    editCta: LinkField;
    onButtonClick: () => void;
  };
}

export const ProfileEditCta = ({ editCta, onButtonClick }: ProfileEditCta.Props) => {
  const CtaContent = (
    <>
      <EditIcon size={16} />
      <span className="flex !border-0 !px-0 !py-1">{editCta.value.text}</span>
    </>
  );

  if (editCta.value.href) {
    return (
      <Link field={editCta} className={EDIT_CTA_CLASSES}>
        {CtaContent}
      </Link>
    );
  }

  return (
    <button className={EDIT_CTA_CLASSES} onClick={onButtonClick} aria-label="Edit">
      {CtaContent}
    </button>
  );
};
