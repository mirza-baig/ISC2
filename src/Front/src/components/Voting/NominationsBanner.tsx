import {
  Field,
  LinkField,
  ImageField,
  RichText,
  NextImage,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { useGetAccountData, useAnalyticsTracking, useLoggedUser } from 'hooks/index';
import { useUserSession } from 'providers/index';
import { ANALYTICS_EVENTS, ACCOUNT_TYPE } from 'constants/index';
import { getUserFlag } from 'utils/userRoles';
import { getAllowedVotingUsers, isVotingUserAllowed } from 'utils/voting';
import { useCallback, useEffect, useRef } from 'react';
import MyAccountSectionContainer from 'components/MyAccount/MyAccountSectionContainer';
import MyAccountSectionFooter from 'components/MyAccount/MyAccountSectionFooter';

interface NominationsBannerProps {
  fields: {
    Header: Field<string>;
    Subhead: Field<string>;
    Body: Field<string>;
    CTA: LinkField;
    Image: ImageField;
    ColumnWidth: Field<string>;
    startDate?: Field<string>;
    endDate?: Field<string>;
    enabled?: Field<boolean>;
    votingForAllowedUsers?: Field<boolean>;
    allowedUsers?: Field<string>;
  };
}

const NOMINATIONS_BANNER_ID = 'nominations-banner';
const DEFAULT_DATE = '0001-01-01T00:00:00Z';

const isWithinSchedule = (startDate?: string, endDate?: string): boolean => {
  if (startDate && endDate && startDate !== DEFAULT_DATE && endDate !== DEFAULT_DATE) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start || now > end) {
      return false;
    }
  }
  return true;
};

const NominationsBanner = ({ fields }: NominationsBannerProps) => {
  const { data: accountData, isLoading } = useGetAccountData();
  const { track } = useAnalyticsTracking();
  const { externalID, isB2BAdminUser, email: currentUserEmail } = useLoggedUser();
  const { userCountry } = useUserSession();
  const viewTrackedRef = useRef(false);
  const userFlag = getUserFlag();

  const enabled = fields.enabled?.value ?? true;
  const votingForAllowedUsers = fields.votingForAllowedUsers?.value ?? false;
  const allowedUsersStr = fields.allowedUsers?.value;
  const hasAllowedUsers = getAllowedVotingUsers(allowedUsersStr).length > 0;
  const isAllowedUser = isVotingUserAllowed({
    allowedUsers: allowedUsersStr,
    email: currentUserEmail,
    memberNumber: externalID,
    enforceAllowedUsers: votingForAllowedUsers,
  });

  const isBodEligible = accountData?.data?.salesforceGetAccountData?.bodNominationAccess === true;

  useEffect(() => {
    if (!viewTrackedRef.current && fields.Header?.value && fields.CTA?.value?.href) {
      if (!enabled) return;
      if (!isWithinSchedule(fields.startDate?.value, fields.endDate?.value)) return;

      let shouldTrackView = false;

      if (votingForAllowedUsers && hasAllowedUsers) {
        shouldTrackView = isAllowedUser;
      } else if (accountData?.data?.salesforceGetAccountData) {
        shouldTrackView = isBodEligible;
      }

      if (shouldTrackView && !viewTrackedRef.current) {
        track({
          event: ANALYTICS_EVENTS.GA_EVENT,
          type: 'engagement',
          subtype: 'nominations_banner_view',
          bo1: true,
          bo3: true,
          banner_id: NOMINATIONS_BANNER_ID,
          user_eligible: true,
          banner_text: fields.Header.value.replace(/<[^>]*>/g, '').substring(0, 100),
          cta_text: fields.CTA.value.text,
          country: userCountry,
          user_type: userFlag,
          account_type: isB2BAdminUser ? ACCOUNT_TYPE.B2B : ACCOUNT_TYPE.B2C,
        });

        viewTrackedRef.current = true;
      }
    }
  }, [
    enabled,
    votingForAllowedUsers,
    hasAllowedUsers,
    isAllowedUser,
    isBodEligible,
    accountData,
    fields.Header,
    fields.CTA,
    fields.startDate,
    fields.endDate,
    track,
    externalID,
    isB2BAdminUser,
    userCountry,
    userFlag,
    currentUserEmail,
  ]);

  const handleCtaClick = useCallback(() => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'nominations_banner_cta_click',
      bo1: true,
      bo2: true,
      bo3: true,
      click_text: fields.CTA?.value?.text?.toLowerCase() || '',
      click_url: fields.CTA?.value?.href?.toLowerCase() || '',
      banner_id: NOMINATIONS_BANNER_ID,
      user_eligible: true,
      country: userCountry,
      user_type: userFlag,
      account_type: isB2BAdminUser ? ACCOUNT_TYPE.B2B : ACCOUNT_TYPE.B2C,
    });

    const href = fields.CTA?.value?.href;
    if (href) {
      window.location.href = href;
    }
  }, [track, userCountry, externalID, userFlag, isB2BAdminUser, fields.CTA]);

  if (!fields.Header?.value || !fields.CTA?.value?.href) {
    return null;
  }

  if (!enabled) {
    return null;
  }

  if (!isWithinSchedule(fields.startDate?.value, fields.endDate?.value)) {
    return null;
  }

  if (votingForAllowedUsers && hasAllowedUsers) {
    if (!isAllowedUser) {
      return null;
    }
  } else {
    if (isLoading || !accountData?.data?.salesforceGetAccountData) {
      return null;
    }
    if (!isBodEligible) {
      return null;
    }
  }

  return (
    <MyAccountSectionContainer fields={{ title: fields.Header?.value }} containerClasses="h-full">
      <div className="flex items-start gap-5 py-5 border-b border-[#E7EAEC]">
        {fields.Image?.value?.src && (
          <div className="flex-shrink-0">
            <NextImage
              field={fields.Image}
              width={62}
              height={62}
              className="w-[62px] h-[62px] rounded"
            />
          </div>
        )}

        <div className="flex-1">
          {fields.Subhead?.value && (
            <p className="text-[15px] font-semibold text-black mb-[9px]">{fields.Subhead.value}</p>
          )}

          {fields.Body?.value && (
            <div className="text-xs font-semibold text-[#575C61]">
              <RichText
                field={fields.Body}
                className="[&_a]:text-[#468145] [&_a]:font-semibold [&_a]:underline"
              />
            </div>
          )}
        </div>
      </div>

      <MyAccountSectionFooter
        primaryCTA={{
          href: fields.CTA?.value?.href || '',
          label: fields.CTA?.value?.text,
          type: 'button',
          onClick: handleCtaClick,
        }}
      />
    </MyAccountSectionContainer>
  );
};

export default NominationsBanner;
