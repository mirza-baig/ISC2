import { Field } from '@sitecore-jss/sitecore-jss-react';

import { useAssignB2BCartToUser } from 'hooks/index';
import { GenericModal } from 'ui/index';

type Props = {
  heading: Field<string>;
  description: Field<string>;
  primaryCtaLabel: Field<string>;
  secondaryCtaLabel: Field<string>;
  onSuccess: () => void;
  cartID: string;
};

export default function AssignB2BCartModal({
  onSuccess,
  heading,
  description,
  primaryCtaLabel,
  secondaryCtaLabel,
  cartID,
}: Props) {
  const { assignB2BCartToUser, isAssigningCart } = useAssignB2BCartToUser({
    onSuccess,
  });

  const onPrimaryCtaClick = () => {
    assignB2BCartToUser({
      cartID,
    });
  };

  return (
    <GenericModal
      heading={heading.value}
      description={description.value}
      primaryCtaLabel={primaryCtaLabel.value}
      secondaryCtaLabel={secondaryCtaLabel.value}
      onPrimaryCtaClick={onPrimaryCtaClick}
      isSubmitting={isAssigningCart}
    />
  );
}
