import { ACCOUNT_CONTACT_ROLES, USER_ROLES } from 'constants/index';
import { AccountContactRelation, UserRole, UserSession } from 'types/index';

export const getUserFlag = (profile?: UserSession | null): UserRole => {
  if (!profile?.user) {
    return USER_ROLES.GUEST;
  }

  if (profile.user.custom_attributes?.associateFlag === 'true') {
    return USER_ROLES.ASSOCIATE;
  }

  if (profile.user.custom_attributes?.memberFlag === 'true') {
    return USER_ROLES.MEMBER;
  }

  if (profile.user.custom_attributes?.candidateFlag === 'true') {
    return USER_ROLES.CANDIDATE;
  }

  return USER_ROLES.REGISTERED;
};

export const getIsUserB2bAdmin = (profile?: UserSession | null): boolean => {
  return profile?.user.custom_attributes?.isB2BAdmin === 'true';
};

export const hasAccountRole = (
  relations: AccountContactRelation[] | undefined,
  role: ACCOUNT_CONTACT_ROLES
): boolean => Boolean(relations?.some(({ roles }) => (roles || '').toLowerCase().includes(role)));

export const getIsAuthorizedBuyer = (relations?: AccountContactRelation[]): boolean =>
  hasAccountRole(relations, ACCOUNT_CONTACT_ROLES.AUTHORIZED_BUYER);
