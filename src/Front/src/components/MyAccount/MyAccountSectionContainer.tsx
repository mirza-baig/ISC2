import clsx from 'clsx';
import { USER_ROLES } from 'constants/roles';
import { useLoggedUser, useSession } from 'hooks/index';
import { useMemo } from 'react';

import { UserRole } from 'types/index';
import { getUserFlag } from 'utils/userRoles';

interface MyAccountSectionContainer {
  fields?: {
    title: string;
  };
  hideForRoles?: UserRole[];
  children: React.ReactNode;
  containerClasses?: string;
  childrenClasses?: string;
}

const MyAccountSectionContainer = ({
  fields,
  children,
  containerClasses,
  childrenClasses,
  hideForRoles = [],
}: MyAccountSectionContainer) => {
  const { session } = useSession();
  const { isB2BAdminUser } = useLoggedUser();

  const hideSection = useMemo(() => {
    if (hideForRoles.length && session) {
      const userFlag = getUserFlag(session);
      const hideForB2b = isB2BAdminUser && hideForRoles.includes(USER_ROLES.B2B_ADMIN);

      return userFlag && (hideForRoles.includes(userFlag) || hideForB2b);
    }

    return false;
  }, [hideForRoles, isB2BAdminUser, session]);

  if (hideSection) {
    return null;
  }

  return (
    <section
      className={clsx(
        'shadow-md rounded-lg p-7 flex flex-col px-5 md:px-7 py-5 mx-1 border-t border-gray-10',
        containerClasses
      )}
    >
      {fields?.title && (
        <h4 className="body-l text-gray-90 tracking-normal font-bold">{fields?.title}</h4>
      )}
      <div className={clsx('flex flex-col', childrenClasses)}>{children}</div>
    </section>
  );
};

export default MyAccountSectionContainer;
