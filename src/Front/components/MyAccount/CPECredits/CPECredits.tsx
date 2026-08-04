import { Field, ImageField, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';
import clsx from 'clsx';

import { ExternalLinkIcon } from 'icons/index';
import { parseFieldsFromURLString } from 'utils/index';
import { CPECreditsLabels, CPECredit as TCPECredit } from 'types/index';
import { useLoggedUser } from 'hooks/index';
import { CPECredit } from 'ui/index';

import MyAccountSectionContainer from 'components/MyAccount/MyAccountSectionContainer';
import MyAccountSectionFooter from 'components/MyAccount/MyAccountSectionFooter';
import { USER_ROLES } from 'constants/index';

type CPECreditsFields = {
  goToPortalCTA: LinkField;
  goToPortalIcon: ImageField;
  moreInformationCTA: LinkField;
  labelsTitlesAndMore: Field<string>;
};

type CPECreditsProps = {
  fields?: CPECreditsFields;
  cpes: TCPECredit;
};

const MAX_CPE_QUANTITY = 3;

export default function CPECredits({ fields }: CPECreditsProps) {
  const { user } = useLoggedUser();

  const labels = useMemo(
    () => parseFieldsFromURLString<CPECreditsLabels>(fields?.labelsTitlesAndMore),
    [fields?.labelsTitlesAndMore]
  );

  const CPEs = user?.cpes || [].slice(0, MAX_CPE_QUANTITY);

  if (!fields || !user || !CPEs.length) {
    return null;
  }

  const showFooter = Boolean(
    fields.goToPortalCTA.value.href || fields.moreInformationCTA.value.href
  );

  return (
    <MyAccountSectionContainer
      fields={{ title: labels.heading }}
      hideForRoles={[USER_ROLES.CANDIDATE]}
    >
      <ul>
        {CPEs.map((cpeCredit) => (
          <CPECredit
            {...labels}
            key={cpeCredit.certName}
            cpeCredit={cpeCredit}
            className={clsx('first:pt-0', !showFooter && 'last:pb-0 last:border-b-0')}
          />
        ))}
      </ul>

      {showFooter && (
        <MyAccountSectionFooter
          primaryCTA={{
            href: fields.moreInformationCTA.value.href,
            label: fields.moreInformationCTA.value.text,
          }}
          secondaryCTA={{
            href: fields.goToPortalCTA.value.href,
            label: fields.goToPortalCTA.value.text,
            Icon: <ExternalLinkIcon size={20} />,
          }}
        />
      )}
    </MyAccountSectionContainer>
  );
}
