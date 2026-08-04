import { Field, LinkField, Link } from '@sitecore-jss/sitecore-jss-nextjs';
import {
  useGetAccountData,
  useLocalStorage,
  useAnalyticsTracking,
  useLoggedUser,
} from 'hooks/index';
import { useUserSession } from 'providers/index';
import { LOCALSTORAGE_KEYS, ANALYTICS_EVENTS, ACCOUNT_TYPE } from 'constants/index';
import { getUserFlag } from 'utils/userRoles';
import { getAllowedVotingUsers, isVotingUserAllowed } from 'utils/voting';
import { useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import CloseIcon from 'icons/CloseIcon';

interface VotingBannerProps {
  fields: {
    votingText: Field<string>;
    CTA: LinkField;
    backGroundColor?: Field<string>;
    fontColor?: Field<string>;
    isClosable?: Field<boolean>;
    enabled?: Field<boolean>;
    startDate?: Field<string>;
    endDate?: Field<string>;
    allowedUsers?: Field<string>;
    votingForAllowedUsers?: Field<boolean>;
  };
}

const VOTING_BANNER_ID = 'voting-banner';
const DEFAULT_DATE = '0001-01-01T00:00:00Z';

const isVotingBannerWithinSchedule = (
  enabled: boolean,
  startDate?: string,
  endDate?: string
): boolean => {
  if (!enabled) {
    return false;
  }

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

const VotingBanner = ({ fields }: VotingBannerProps) => {
  const { data: accountData, isLoading } = useGetAccountData();
  const { track } = useAnalyticsTracking();
  const { externalID, isB2BAdminUser, email: currentUserEmail } = useLoggedUser();
  const { userCountry } = useUserSession();
  const [closedBanners, setClosedBanners] = useLocalStorage<string[]>(
    LOCALSTORAGE_KEYS.BANNERS,
    []
  );
  const viewTrackedRef = useRef(false);
  const userFlag = getUserFlag();

  const allowedUsersStr = fields.allowedUsers?.value;
  const votingForAllowedUsers = fields.votingForAllowedUsers?.value ?? false;
  const hasAllowedUsers = getAllowedVotingUsers(allowedUsersStr).length > 0;
  const isAllowedUser = isVotingUserAllowed({
    allowedUsers: allowedUsersStr,
    email: currentUserEmail,
    memberNumber: externalID,
    enforceAllowedUsers: votingForAllowedUsers,
  });

  useEffect(() => {
    const isEnabled = fields.enabled?.value ?? false;

    if (!viewTrackedRef.current && fields.votingText?.value && fields.CTA?.value?.href) {
      let shouldTrackView = false;

      if (isVotingBannerWithinSchedule(isEnabled, fields.startDate?.value, fields.endDate?.value)) {
        if (votingForAllowedUsers && hasAllowedUsers) {
          shouldTrackView = isAllowedUser;
        } else if (accountData?.data?.salesforceGetAccountData) {
          const isEligible = accountData.data.salesforceGetAccountData.boardElectionEligible;
          shouldTrackView = Boolean(isEligible);
        }
      }

      if (shouldTrackView) {
        const isClosable = fields.isClosable?.value ?? true;
        const isBannerClosed = isClosable ? closedBanners?.includes(VOTING_BANNER_ID) : false;

        if (!isBannerClosed) {
          track({
            event: ANALYTICS_EVENTS.GA_EVENT,
            type: 'engagement',
            subtype: 'voting_banner_view',
            bo1: true,
            bo3: true,
            banner_id: VOTING_BANNER_ID,
            user_eligible: true,
            banner_text: fields.votingText.value.replace(/<[^>]*>/g, '').substring(0, 100),
            cta_text: fields.CTA.value.text || 'Vote',
            country: userCountry,
            user_type: userFlag,
            account_type: isB2BAdminUser ? ACCOUNT_TYPE.B2B : ACCOUNT_TYPE.B2C,
          });

          viewTrackedRef.current = true;
        }
      }
    }
  }, [
    fields.enabled,
    fields.startDate,
    fields.endDate,
    accountData,
    fields.votingText,
    fields.CTA,
    fields.isClosable,
    closedBanners,
    track,
    externalID,
    isB2BAdminUser,
    userCountry,
    userFlag,
    hasAllowedUsers,
    isAllowedUser,
    currentUserEmail,
    votingForAllowedUsers,
  ]);

  const handleClose = useCallback(
    (id: string) => {
      track({
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'engagement',
        subtype: 'voting_banner_close',
        bo1: true,
        click_text: 'close banner',
        banner_id: VOTING_BANNER_ID,
        country: userCountry,
        user_type: userFlag,
        account_type: isB2BAdminUser ? ACCOUNT_TYPE.B2B : ACCOUNT_TYPE.B2C,
      });

      setClosedBanners((prevClosedBanners) => {
        const currentValues = prevClosedBanners || [];
        return [...currentValues, id];
      });
    },
    [setClosedBanners, track, userCountry, externalID, userFlag, isB2BAdminUser]
  );

  const handleVotingCtaClick = useCallback(
    (evt: React.MouseEvent<HTMLAnchorElement>) => {
      const anchorElement = evt.currentTarget;
      const anchorText = anchorElement.innerText?.toLowerCase() || 'vote';
      const anchorHref = anchorElement.href?.toLowerCase() || '';

      track({
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'engagement',
        subtype: 'voting_banner_cta_click',
        bo1: true,
        bo2: true,
        bo3: true,
        click_text: anchorText,
        click_url: anchorHref,
        banner_id: VOTING_BANNER_ID,
        user_eligible: true,
        country: userCountry,
        user_type: userFlag,
        account_type: isB2BAdminUser ? ACCOUNT_TYPE.B2B : ACCOUNT_TYPE.B2C,
      });
    },
    [track, userCountry, externalID, userFlag, isB2BAdminUser]
  );

  const backgroundColor = fields.backGroundColor?.value;
  const fontColor = fields.fontColor?.value;
  const isClosable = fields.isClosable?.value ?? true;

  if (!fields.votingText?.value || !fields.CTA?.value?.href) {
    return null;
  }

  const isEnabled = fields.enabled?.value ?? false;

  if (!isVotingBannerWithinSchedule(isEnabled, fields.startDate?.value, fields.endDate?.value)) {
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

    const isEligible = accountData.data.salesforceGetAccountData.boardElectionEligible;

    if (!isEligible) {
      return null;
    }
  }

  if (isClosable) {
    const isBannerClosed = closedBanners?.includes(VOTING_BANNER_ID);
    if (isBannerClosed) {
      return null;
    }
  }

  return (
    <div
      className={clsx(
        'flex relative p-2.5 mb-1 sm:px-16 sm:py-5 gap-3 sm:gap-5',
        'flex-col sm:flex-row items-start sm:items-center'
      )}
      style={{
        backgroundColor,
        color: fontColor,
      }}
    >
      <div className="flex-1 text-xs leading-5 sm:leading-6 sm:text-sm-base body-m">
        <div dangerouslySetInnerHTML={{ __html: fields.votingText.value }} />
      </div>

      <div className="sm:mt-0 sm:ml-4">
        <Link
          field={fields.CTA}
          className="cta relative flex space-x-2 !text-sm !tracking-normal primary-cta w-fit mt-4"
          onClick={handleVotingCtaClick}
        >
          {fields.CTA.value.text || 'Vote'}
        </Link>
      </div>

      {isClosable && (
        <button
          aria-label="Close banner"
          className="absolute top-2 right-2 sm:ml-4 h-4"
          onClick={() => handleClose(VOTING_BANNER_ID)}
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
};

export default VotingBanner;
