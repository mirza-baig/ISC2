import { format } from 'date-fns';
import { useMemo } from 'react';
import { formatDateRange, getUTCTime } from 'utils/date';

export namespace LineItemDate {
  export type Props = {
    attributes: { [key: string]: string };
  };
}

export const LineItemDate = ({ attributes }: LineItemDate.Props) => {
  const date = useMemo(() => {
    return {
      isoStart: getUTCTime({
        time: attributes.start_time,
        date: attributes.start_date,
        timeZone: attributes.time_zone_iana || attributes.time_zone,
      }),
      isoEnd: getUTCTime({
        time: attributes.end_time,
        date: attributes.end_date,
        timeZone: attributes.time_zone_iana || attributes.time_zone,
      }),
    };
  }, [attributes]);

  const dateValue = useMemo(() => formatDateRange(date), [date]);

  const isTimeSetUp = attributes.start_time && attributes.end_time;
  const time =
    date.isoStart &&
    date.isoEnd &&
    isTimeSetUp &&
    `, ${format(date.isoStart, 'HH:mm aa')} to ${format(date.isoEnd, 'HH:mm aa')}`;

  return (
    <label className="flex flex-col space-y-1 body-s mt-1 text-gray-70">
      {dateValue}
      {time}
    </label>
  );
};
