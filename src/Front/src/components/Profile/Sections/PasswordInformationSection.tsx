import { LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { ProfileSection } from '../Base/ProfileSection';

export namespace PasswordInformationSection {
  export type Props = {
    heading: string;
    editCta: LinkField;
  };
}

export const PasswordInformationSection = (props: PasswordInformationSection.Props) => {
  return (
    <ProfileSection heading={{ value: props.heading }} editCta={props.editCta}>
      {() => <label className="body-m text-sm-base text-gray-70">••••••••••</label>}
    </ProfileSection>
  );
};
