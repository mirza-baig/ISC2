import { useMemo } from 'react';

import useLoggedUser from './useLoggedUser';

interface UserRoleValueConfig<T> {
  memberValue: T;
  candidateValue: T;
  associateValue: T;
  nonMemberValue?: T;
  b2bAdminValue?: T;
  defaultValue?: T;
}

export default function useUserRoleValue<T>({
  memberValue,
  candidateValue,
  associateValue,
  nonMemberValue,
  defaultValue,
}: UserRoleValueConfig<T>): T | undefined {
  const { isUserCandidate, isUserMember, isUserAssociate, isUserLoggedIn } = useLoggedUser();

  const value = useMemo(() => {
    if (isUserCandidate) {
      return candidateValue;
    }

    if (isUserMember) {
      return memberValue;
    }

    if (isUserAssociate) {
      return associateValue;
    }

    if (isUserLoggedIn && nonMemberValue) {
      return nonMemberValue;
    }

    return defaultValue;
  }, [
    isUserCandidate,
    isUserMember,
    isUserAssociate,
    isUserLoggedIn,
    nonMemberValue,
    defaultValue,
    candidateValue,
    memberValue,
    associateValue,
  ]);

  return value;
}
