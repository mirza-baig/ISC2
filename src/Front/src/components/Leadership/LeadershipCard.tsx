import { NextImage, Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { LeadershipCardFields, SocialProfileLink } from 'types/index';

import LeadershipCardModal from './LeadershipCardModal';

export interface LeadershipCardProps {
  id: string;
  children?: SocialProfileLink[];
  fields: LeadershipCardFields;
}

const LeadershipCard = ({ children, fields }: LeadershipCardProps) => {
  if (!fields) {
    return null;
  }

  return (
    <section className="flex flex-col w-full">
      <NextImage className="aspect-square rounded-md w-full" field={fields?.image} />
      <div className="flex-1 flex-col w-full">
        <Text tag="h2" className="body-l mt-4 mb-1" field={fields?.nameCertification} />
        {Boolean(fields?.location?.value) && (
          <Text tag="div" className="body-m text-gray-70 mb-1" field={fields?.location} />
        )}
        {Boolean(fields?.title?.value) && (
          <Text tag="div" className="body-m mb-1" field={fields?.title} />
        )}
      </div>
      {Boolean(fields?.ctaLabel?.value) && (
        <LeadershipCardModal className="mt-2" fields={fields} socialProfileLinks={children} />
      )}
    </section>
  );
};

export default LeadershipCard;
