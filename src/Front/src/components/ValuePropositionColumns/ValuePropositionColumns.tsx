import {
  RichText,
  RichTextField,
  Text,
  TextField,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

interface ValuePropositionColumn {
  id: string;
  fields: {
    title: TextField;
    description: TextField;
    bulletItems: RichTextField;
  };
}

type ValuePropositionColumnsProps = ComponentProps & {
  fields: {
    children?: ValuePropositionColumn[];
  };
};

const ValuePropositionColumns = ({ fields, params }: ValuePropositionColumnsProps): JSX.Element => {
  const renderingId = params?.RenderingIdentifier;

  return (
    <section
      id={renderingId || undefined}
      className={`component value-proposition-columns bg-white-00 py-12 ${params?.styles || ''}`}
    >
      <div className="mx-auto grid max-w-8xl grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-12 px-8">
        {(fields?.children || []).map((column) => (
          <article key={column.id}>
            <Text
              tag="h3"
              field={column.fields?.title}
              className="m-0 text-2xl font-normal leading-8 text-black-100"
            />

            <Text
              tag="p"
              field={column.fields?.description}
              className="mb-6 mt-3 text-base text-[#666]"
            />

            <RichText
              field={column.fields?.bulletItems}
              className="text-xsm leading-[1.8] text-[#666] [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0 [&_li]:relative [&_li]:mb-2 [&_li]:pl-6 [&_li:last-child]:mb-0 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.4em] [&_li]:before:h-2 [&_li]:before:w-2 [&_li]:before:rounded-full [&_li]:before:border-2 [&_li]:before:border-[#3f8e44] [&_li]:before:content-['']"
            />
          </article>
        ))}
      </div>
    </section>
  );
};

export default withDatasourceCheck()<ValuePropositionColumnsProps>(ValuePropositionColumns);
