import React from 'react';
import {
  ComponentParams,
  ComponentRendering,
  Placeholder,
} from '@sitecore-jss/sitecore-jss-nextjs';

import { useHeaderNavigation, useLayout } from 'providers/index';
import { useLoggedUser } from 'hooks/index';

interface ComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
}

export const MyAccountLayout = (props: ComponentProps): JSX.Element => {
  const { isEditing } = useLayout();
  const { isRegisterUser, isUserMember, isUserAssociate, isUserCandidate, isB2BAdminUser } =
    useLoggedUser();
  const { userRoleMenuLinks } = useHeaderNavigation();

  return (
    <div className="max-width-container pt-40 space-y-5 overflow-hidden">
      <Placeholder name="my-account-top-content" rendering={props.rendering} />
      <div className="my-account flex flex-col w-full lg:flex-row lg:gap-x-12">
        <section className="w-full lg:w-80 lg:pb-30">
          <p className="hidden lg:block headline-s line-clamp-3 max-lg:cta font-normal !p-0 !border-0 mb-3 lg:mb-10 text-black-100 lg:px-5 lg:h-12 lg:leading-48">
            {userRoleMenuLinks?.sectionTitle}
          </p>

          <div className="flex flex-col">
            <Placeholder name="my-account-left-column" rendering={props.rendering} />
          </div>
        </section>

        <section className="right-column flex flex-col flex-1 pb-10 space-y-5 sm:space-y-10 overflow-hidden">
          <Placeholder name="my-account-right-column" rendering={props.rendering} />
          {(isEditing || isRegisterUser) && (
            <Placeholder name="my-account-right-column-non-members" rendering={props.rendering} />
          )}
          {(isEditing || isUserMember || isUserAssociate) && (
            <Placeholder name="my-account-right-column-members" rendering={props.rendering} />
          )}
          {(isEditing || isUserCandidate) && (
            <Placeholder name="my-account-right-column-candidates" rendering={props.rendering} />
          )}
          {(isEditing || isB2BAdminUser) && (
            <Placeholder name="my-account-right-column-b2b" rendering={props.rendering} />
          )}
        </section>
      </div>
    </div>
  );
};

export default MyAccountLayout;
