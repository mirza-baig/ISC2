import { useMemo } from 'react';

import useBreakpoint from 'hooks/useBreakpoint';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import InformationalCard, {
  InformationalCardProps,
} from 'components/InformationalCard/InformationalCard';

export interface InformationalCardsProps {
  fields: {
    columnsNumber: Field<number>;
    informationalCards: InformationalCardProps[];
  };
}

const ONE_COLUMN_BREAKPOINTS = ['sm', 'max-sm'];

export default function InformationalCards({ fields }: InformationalCardsProps) {
  const breakpoint = useBreakpoint();

  const numberOfColumns = useMemo(() => {
    if (ONE_COLUMN_BREAKPOINTS.includes(breakpoint) || !fields?.columnsNumber?.value) {
      return 1;
    }

    return fields.columnsNumber.value;
  }, [breakpoint, fields?.columnsNumber]);

  if (!fields) {
    return null;
  }

  return (
    <section
      className="grid gap-5 sm:gap-8 pb-13"
      style={{
        gridTemplateColumns: `repeat(${numberOfColumns}, minmax(0, 1fr))`,
      }}
    >
      {fields?.informationalCards?.map((card, index) => (
        <InformationalCard key={index} fields={card.fields} />
      ))}
    </section>
  );
}
