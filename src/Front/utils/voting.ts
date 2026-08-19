const ALLOWED_USERS_SEPARATOR = /[,\n;\r]+/;

const normalizeAllowedUserValue = (value?: string | null) => value?.trim().toLowerCase() || '';

export const getAllowedVotingUsers = (allowedUsers?: string | null): string[] => {
  return (
    allowedUsers?.split(ALLOWED_USERS_SEPARATOR).map(normalizeAllowedUserValue).filter(Boolean) ??
    []
  );
};

export const isVotingUserAllowed = ({
  allowedUsers,
  email,
  memberNumber,
  enforceAllowedUsers = true,
}: {
  allowedUsers?: string | null;
  email?: string | null;
  memberNumber?: string | null;
  enforceAllowedUsers?: boolean;
}) => {
  if (!enforceAllowedUsers) {
    return true;
  }

  const allowedUserValues = getAllowedVotingUsers(allowedUsers);

  if (!allowedUserValues.length) {
    return true;
  }

  const currentUserValues = [email, memberNumber].map(normalizeAllowedUserValue).filter(Boolean);

  return currentUserValues.some((value) => allowedUserValues.includes(value));
};
