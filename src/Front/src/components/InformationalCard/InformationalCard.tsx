import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';
import clsx from 'clsx';

import BaseCard, { BaseCardFields } from '../../ui/BaseCard';

interface InformationalCardFields extends BaseCardFields {
  wholeCardLink: LinkField;
  withBorder: Field<boolean>;
}

export interface InformationalCardProps {
  fields: InformationalCardFields;
}

const InformationalCard: React.FC<InformationalCardProps> = ({
  fields,
}: InformationalCardProps) => {
  const Tag = fields?.wholeCardLink?.value?.href ? 'a' : 'div';

  const description = useMemo(() => {
    if (fields?.description?.value && fields?.wholeCardLink?.value?.text) {
      return {
        ...fields.description,
        value: fields.description.value.concat(`<span> ${fields.wholeCardLink.value.text}</span>`),
      };
    }

    return fields?.description;
  }, [fields?.description, fields?.wholeCardLink?.value?.text]);

  return (
    <Tag
      href={fields?.wholeCardLink?.value?.href}
      className={clsx(
        'p-4 flex w-full',
        fields?.withBorder?.value && 'rounded-lg shadow-card bg-white-00'
      )}
    >
      <BaseCard fields={{ ...fields, description }} />
    </Tag>
  );
};

export default InformationalCard;
