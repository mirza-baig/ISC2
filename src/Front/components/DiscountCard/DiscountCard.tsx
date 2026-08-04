import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';

import { useLoggedUser } from 'hooks/index';
import BaseCard, { BaseCardFields } from 'ui/BaseCard';

interface DiscountCardFields extends BaseCardFields {
  enabled: Field<boolean>;
  learnMoreLink: LinkField;
}

interface DiscountCardProps {
  fields: DiscountCardFields;
}

const DiscountCard: React.FC<DiscountCardProps> = ({ fields }: DiscountCardProps) => {
  const { isUserMember, isUserCandidate } = useLoggedUser();

  const description = useMemo(() => {
    if (fields?.description?.value && fields?.learnMoreLink?.value?.text) {
      return {
        ...fields.description,
        value: fields.description.value.concat(`<span> ${fields.learnMoreLink.value.text}</span>`),
      };
    }
    return fields?.description;
  }, [fields?.description, fields?.learnMoreLink?.value?.text]);

  if (!fields?.enabled || isUserMember || isUserCandidate) return null;

  return (
    <a
      href={fields?.learnMoreLink?.value?.href}
      className="rounded-lg p-4 shadow-card bg-white-00 w-full flex"
    >
      <BaseCard fields={{ ...fields, description }} />
    </a>
  );
};

export default DiscountCard;
