import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import clsx from 'clsx';

import { CPECreditsLabels, CPECredit as TCPECredit } from 'types/index';
import { extractSrc } from 'utils/index';

export namespace CPECredit {
  export type Props = Omit<CPECreditsLabels, 'heading'> & {
    display?: 'row' | 'column';
    className?: string;
    cpeCredit: TCPECredit;
  };
}

const formatDate = (date?: string | null) => {
  if (!date) {
    return '';
  }

  const formattedDate = parseISO(date);

  return `${format(formattedDate, 'MMM')} ${format(formattedDate, 'yyyy')}`;
};

const formatDateRange = (startDate: string, endDate: string) => {
  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  return startDate || endDate;
};

const CONTAINER_CLASSES = {
  row: 'md:flex-row md:gap-x-15 items-center',
  column: '',
};

export const CPECredit = ({
  cpeCredit,
  display = 'row',
  className = '',
  tasksCompletedLabel,
  certificationStatusLabel,
  cpesCompletedLabel,
  percentageCompletedLabel,
}: CPECredit.Props) => {
  const startDate = formatDate(cpeCredit.startDate);
  const endDate = formatDate(cpeCredit.endDate);
  const dateRange = formatDateRange(startDate, endDate);

  const getImageSrc = () => {
    const src = extractSrc(cpeCredit.image);
    if (src) {
      return `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL || ''}${src}`;
    }

    return '';
  };

  const percentage = useMemo(() => {
    if (
      cpeCredit.percentComplete !== undefined &&
      cpeCredit.percentComplete !== null &&
      !isNaN(cpeCredit.percentComplete)
    ) {
      return cpeCredit.percentComplete;
    }

    if (cpeCredit.creditsNeeded === 0) {
      return 0;
    }

    if (!cpeCredit.creditsNeeded || isNaN(cpeCredit.creditsNeeded)) {
      return 0;
    }

    return Math.round((cpeCredit.creditsApplied * 100) / cpeCredit.creditsNeeded);
  }, [cpeCredit.percentComplete, cpeCredit.creditsApplied, cpeCredit.creditsNeeded]);

  return (
    <li className={clsx('py-5 border-b border-gray-30', className)}>
      {Boolean(certificationStatusLabel) && (
        <label className="body-m">
          {certificationStatusLabel.replace('{certification}', cpeCredit.certName)}
        </label>
      )}

      <div className={clsx('flex flex-col', CONTAINER_CLASSES[display])}>
        <div className="flex items-center w-full my-3 space-x-5 md:w-50">
          <img
            src={getImageSrc()}
            alt={cpeCredit.certName}
            className="h-16 aspect-square object-cover"
          />

          <div className="flex flex-col text-isc2-green">
            {Boolean(tasksCompletedLabel) && (
              <label className="headline-s font-normal">
                {tasksCompletedLabel
                  .replace('{completed}', cpeCredit.creditsApplied.toString())
                  .replace('{total}', cpeCredit.creditsNeeded.toString())}
              </label>
            )}
            {Boolean(cpesCompletedLabel) && <label className="body-s">{cpesCompletedLabel}</label>}
          </div>
        </div>

        <div className="flex flex-col w-full md:flex-1 space-y-2">
          {dateRange && <label className="text-gray-90 font-semibold body-s">{dateRange}</label>}
          <span className="bg-gray-30 rounded-lg w-full h-5 relative overflow-hidden">
            <span className="bg-lime absolute left-0 h-full" style={{ width: `${percentage}%` }} />
          </span>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-lime" />
            {Boolean(percentageCompletedLabel) && (
              <label className="body-s text-gray-90">
                {percentageCompletedLabel.replace('{percentage}', percentage.toString())}
              </label>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};
