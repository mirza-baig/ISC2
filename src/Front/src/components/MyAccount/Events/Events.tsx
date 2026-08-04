import { Field, ImageField, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { parseFieldsFromURLString } from 'utils/fields';
import { useMemo } from 'react';
import ComponentCard, { MyAccountSectionCardFields } from '../MyAccountSectionCard';
import MyAccountSectionContainer from '../MyAccountSectionContainer';
import MyAccountSectionFooter from '../MyAccountSectionFooter';

interface EventsProps {
  fields: {
    labelsTitlesAndMore: Field<string>;
    seeAllLink: LinkField;
    eventsList: {
      id: string;
      fields: {
        name: Field<string>;
        registrationAction: LinkField;
        type: Field<string>;
        date: Field<string>;
        image: ImageField;
        location: Field<string>;
      };
    }[];
  };
}

interface EventsLabels {
  title: string;
  location: string;
  type: string;
  date: string;
}

const Events = ({ fields }: EventsProps) => {
  const labels = useMemo(
    () => parseFieldsFromURLString<EventsLabels>(fields?.labelsTitlesAndMore),
    [fields.labelsTitlesAndMore]
  );

  const cards = fields.eventsList.map((event) => {
    const { name, registrationAction, type, date, image, location } = event.fields;

    const componentFields = {
      name: name.value,
      labels: [],
      image: { src: image.value?.src, alt: image.value?.alt?.toString() || name },
      cta: {
        type: 'button',
        label: registrationAction.value.text,
        href: registrationAction.value.href,
        target: registrationAction.value.target,
      },
    } as MyAccountSectionCardFields;

    if (location.value) {
      componentFields.labels?.push({ title: labels?.location, content: location.value });
    }

    if (type.value) {
      componentFields.labels?.push({
        title: labels?.type,
        content: type.value,
      });
    }

    if (date.value) {
      componentFields.labels?.push({
        title: labels?.date,
        content: date.value,
      });
    }

    return <ComponentCard key={event.id} fields={componentFields} />;
  });

  return (
    <MyAccountSectionContainer fields={{ title: labels?.title }}>
      {cards}
      <MyAccountSectionFooter
        primaryCTA={{
          href: fields?.seeAllLink?.value?.href,
          label: fields?.seeAllLink?.value?.text,
        }}
      />
    </MyAccountSectionContainer>
  );
};

export default Events;
