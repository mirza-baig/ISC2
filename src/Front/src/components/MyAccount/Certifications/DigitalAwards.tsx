import { Field, ImageField, LinkField, NextImage } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { useMemo } from 'react';

import { useGetSubscriptions, useLoggedUser } from 'hooks/index';
import { DropLinkFieldType } from 'types/index';
import { AWARD_CARD_TYPES, CERTIFICATION_STATUS_MAINTENANCE } from 'constants/index';
import { parseFieldsFromURLString } from 'utils/fields';
import MyAccountSectionContainer from '../MyAccountSectionContainer';
import { AwardItem } from './AwardItem';
import MyAccountSectionFooter from '../MyAccountSectionFooter';
import { AWARD_TYPES } from 'constants/index';

interface DigitalAwardsLabels {
  awardedDateLabel: string;
  expirationDateLabel: string;
}

interface DigitalAwardsProps {
  fields: {
    awardType: DropLinkFieldType;
    cardType: DropLinkFieldType;
    title: Field<string>;
    labelsTooltipsAndMore: Field<string>;
    primaryCta: LinkField;
    primaryCtaIcon: ImageField;
    secondaryCta?: LinkField;
    secondaryCtaIcon?: ImageField;
  };
}

const AWARD_ITEMS_WRAPPER_CLASSES =
  'flex h-full p-5 xs:border-b xs:last:border-b-0 sm:border-b-0 sm:[&:not(:nth-child(2n+1))]:border-l md:[&:not(:nth-child(2n+1))]:border-l-0 md:[&:not(:nth-child(3n+1))]:border-l border-gray-30';
const AWARD_SINGLE_WRAPPER_CLASSES = 'flex gap-5 border-b border-gray-30 py-9';

const DigitalAwards = ({ fields }: DigitalAwardsProps) => {
  const { user, isUserAssociate, isB2BAdminUser } = useLoggedUser();
  const { isSuspended, isGettingSubscriptions } = useGetSubscriptions();
  const certifications = user?.certifications;
  const badges = user?.badges;
  const awardType = fields?.awardType?.fields.Value.value;
  const awardCardType = fields.cardType?.fields.Value.value;

  const filteredCertifications = useMemo(
    () =>
      certifications
        ?.filter(
          (certification) =>
            Boolean(certification?.badgeType) &&
            certification?.status === CERTIFICATION_STATUS_MAINTENANCE
        )
        .sort(
          (a, b) =>
            new Date(b?.activeCertificationTerm?.startDate).getTime() -
            new Date(a?.activeCertificationTerm?.startDate).getTime()
        ),
    [certifications]
  );

  const sortedBadges = useMemo(
    () =>
      badges
        ?.filter((badge) => Boolean(badge?.badgeType))
        .sort((a, b) => new Date(b?.awardedDate).getTime() - new Date(a?.awardedDate).getTime()),
    [badges]
  );

  const isCertificationsEmpty = useMemo(
    () => !filteredCertifications || !filteredCertifications?.length,
    [filteredCertifications]
  );

  const isBadgesEmpty = useMemo(() => !sortedBadges || !sortedBadges?.length, [sortedBadges]);

  const SecondaryCTAContent = useMemo(() => {
    // Associate and B2B users should not see secondary CTA (print certifications) on certifications
    if (isUserAssociate && awardType === AWARD_TYPES.certifications) {
      return undefined;
    }

    return {
      href: fields.secondaryCta?.value.href,
      label: fields.secondaryCta?.value.text,
      target: fields.secondaryCta?.value.target,
      Icon: (
        <NextImage
          field={fields.secondaryCtaIcon}
          className="mr-2 aspect-square"
          width={15}
          height={15}
        />
      ),
    };
  }, [
    awardType,
    fields.secondaryCta?.value.href,
    fields.secondaryCta?.value.text,
    fields.secondaryCta?.value.target,
    fields.secondaryCtaIcon,
    isB2BAdminUser,
    isUserAssociate,
  ]);

  if (
    !fields ||
    isSuspended ||
    isGettingSubscriptions ||
    ((awardType !== AWARD_TYPES.certifications || isCertificationsEmpty) &&
      (awardType !== AWARD_TYPES.badges || isBadgesEmpty))
  ) {
    return null;
  }

  // On the dashboard, display a single badge only if there is no certification
  if (
    awardType === AWARD_TYPES.badges &&
    awardCardType === AWARD_CARD_TYPES.single &&
    !isCertificationsEmpty
  ) {
    return null;
  }

  const labels = parseFieldsFromURLString<DigitalAwardsLabels>(fields?.labelsTooltipsAndMore);

  return (
    <MyAccountSectionContainer fields={{ title: fields.title.value }}>
      {awardCardType === AWARD_CARD_TYPES.list && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 border-b border-gray-30 pb-4">
          {awardType === AWARD_TYPES.badges &&
            sortedBadges &&
            sortedBadges.map(
              (badge, index) =>
                badge && (
                  <div key={`${badge?.id}-${index}`} className={AWARD_ITEMS_WRAPPER_CLASSES}>
                    <AwardItem
                      image={badge.badgeType?.image}
                      name={badge.badgeType?.name}
                      awardedDate={badge.awardedDate}
                      expiredDate={badge.expiredDate}
                      awardedDateLabel={labels?.awardedDateLabel}
                      expirationDateLabel={labels?.expirationDateLabel}
                    />
                  </div>
                )
            )}

          {awardType === AWARD_TYPES.certifications &&
            filteredCertifications &&
            filteredCertifications.map(
              (certification, index) =>
                certification && (
                  <div key={`${certification.id}-${index}`} className={AWARD_ITEMS_WRAPPER_CLASSES}>
                    <AwardItem
                      image={certification.badgeType?.image}
                      name={certification.badgeType?.name}
                      awardedDate={certification.activeCertificationTerm?.startDate}
                      expiredDate={certification.activeCertificationTerm?.endDate}
                      awardedDateLabel={labels?.awardedDateLabel}
                      expirationDateLabel={labels?.expirationDateLabel}
                    />
                  </div>
                )
            )}
        </div>
      )}
      {awardCardType === AWARD_CARD_TYPES.single &&
        (awardType === AWARD_TYPES.certifications &&
        filteredCertifications &&
        filteredCertifications[0] ? (
          <div className={AWARD_SINGLE_WRAPPER_CLASSES}>
            <AwardItem
              image={filteredCertifications[0].badgeType?.image}
              name={filteredCertifications[0].badgeType?.name}
              awardedDate={filteredCertifications[0].activeCertificationTerm?.startDate}
              expiredDate={filteredCertifications[0].activeCertificationTerm?.endDate}
              awardedDateLabel={labels?.awardedDateLabel}
              expirationDateLabel={labels?.expirationDateLabel}
            />
          </div>
        ) : (
          awardType === AWARD_TYPES.badges &&
          sortedBadges &&
          sortedBadges[0] && (
            <div className={AWARD_SINGLE_WRAPPER_CLASSES}>
              <AwardItem
                image={sortedBadges[0].badgeType?.image}
                name={sortedBadges[0].badgeType?.name}
                awardedDate={sortedBadges[0].awardedDate}
                expiredDate={sortedBadges[0].expiredDate}
                awardedDateLabel={labels?.awardedDateLabel}
                expirationDateLabel={labels?.expirationDateLabel}
              />
            </div>
          )
        ))}

      <MyAccountSectionFooter
        primaryCTA={{
          href: fields.primaryCta.value.href,
          label: fields.primaryCta.value.text,
          target: fields.primaryCta.value.target,
          Icon: (
            <NextImage
              field={fields.primaryCtaIcon}
              className={clsx('ml-2 aspect-square', fields.secondaryCta?.value && 'mr-2')}
              width={15}
              height={15}
            />
          ),
        }}
        secondaryCTA={SecondaryCTAContent}
      />
    </MyAccountSectionContainer>
  );
};

export default DigitalAwards;
