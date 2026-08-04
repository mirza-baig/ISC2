import { Field, LinkField, RichTextField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';

import { RichTextUI, SectionTitle } from 'ui/index';

import Statistic from './Statistic';

type RichTextWithStatsProps = {
  fields: {
    sectionTitle: Field<string>;
    sectionDescription: Field<string>;
    sectionLink: LinkField;
    mainContent: RichTextField;
    statistic1Text?: TextField;
    statistic1Number?: TextField;
    statistic2Text?: TextField;
    statistic2Number?: TextField;
    statistic3Text?: TextField;
    statistic3Number?: TextField;
  };
};

const RichTextWithStatistics = ({ fields }: RichTextWithStatsProps) => {
  if (!fields) {
    return null;
  }

  const {
    sectionTitle: title,
    sectionDescription: description,
    sectionLink: link,
    ...otherFields
  } = fields;

  return (
    <div className="px-5 md:px-16 py-14 md:py-20 bg-gray-10 mb-14 md:mb-20">
      <SectionTitle title={title} subtitle={description} link={link} className="!px-0" />

      <section className="flex flex-col md:flex-row space-y-9 md:space-y-0">
        <RichTextUI
          className="max-w-none md:max-w-xl lg:max-w-2xl xl:max-w-3xl"
          value={otherFields.mainContent?.value}
        />

        <div className="rich-text text-gray-90 flex flex-col md:pl-14 lg:pl-36 space-y-16">
          <Statistic name={fields.statistic1Text} value={fields.statistic1Number} />
          <Statistic name={fields.statistic2Text} value={fields.statistic2Number} />
          <Statistic name={fields.statistic3Text} value={fields.statistic3Number} />
        </div>
      </section>
    </div>
  );
};

export default RichTextWithStatistics;
