import { UserData } from 'types/index';
import { ProfileInfoLabel } from './ProfileInfoLabel';

export namespace ProfileInfoAddress {
  export type Props = {
    title: string;
    address?: UserData['mailingAddress'];
  };
}

export const ProfileInfoAddress = ({ title, address }: ProfileInfoAddress.Props) => {
  if (!address) {
    return null;
  }

  const secondLine = [address.city, address.state, address.postalCode].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col space-y-0.5">
      <label className="body-m text-sm-base text-black">{title}</label>
      <ProfileInfoLabel>{address.street}</ProfileInfoLabel>
      <ProfileInfoLabel>{secondLine}</ProfileInfoLabel>
      <ProfileInfoLabel>{address.country}</ProfileInfoLabel>
    </div>
  );
};
