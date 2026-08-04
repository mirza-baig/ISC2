import { Field, ImageField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useUserPicture } from 'hooks/index';
import { LoadingIndicator, UserDataSummary } from 'ui/index';
import { parseFieldsFromURLString } from 'utils/index';
import { useMemo } from 'react';
import ProfileSummaryPicture from './ProfileSummaryPicture';

interface ProfileSummaryProps {
  fields: {
    defaultProfilePic: ImageField;
    labelsTitlesAndMore: Field<string>;
  };
}

const ProfileSummary = ({ fields }: ProfileSummaryProps) => {
  const { isGettingUserPicture } = useUserPicture();
  const labels = useMemo(
    () => parseFieldsFromURLString<UserDataSummary.Labels>(fields.labelsTitlesAndMore),
    [fields.labelsTitlesAndMore]
  );

  if (isGettingUserPicture) {
    return (
      <div className="hidden lg:flex bg-gray-10 p-10 justify-center space-y-4 rounded-lg">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="hidden lg:block bg-gray-10 p-10 space-y-4 rounded-lg">
      <ProfileSummaryPicture fields={{ labels, defaultProfilePicture: fields.defaultProfilePic }} />
      <UserDataSummary labels={labels} />
    </div>
  );
};

export default ProfileSummary;
