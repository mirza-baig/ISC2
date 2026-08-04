import { Field, ImageField, LinkField, RichTextField } from '@sitecore-jss/sitecore-jss-nextjs';

export interface HeroCardBaseProps {
  id: string;
  alignment?: 'left' | 'right';
  fields: {
    contentOnLeft: Field<boolean>;
    description: RichTextField;
    eyebrow: Field<string>;
    headline: Field<string>;
    image: ImageField;
    imageFullWidth: Field<boolean>;
    logoImage: ImageField;
    primaryCTA?: LinkField;
    secondaryCTA?: LinkField;
  };
}
