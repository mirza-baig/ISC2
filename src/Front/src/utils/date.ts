import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import { ProductDate, ProductHit, ProductIsoDates } from 'types/forms';
import { timeZoneOffsets } from './timezones';
import { format } from 'date-fns';

export const showDateField = (date?: Field<string>) => {
  const value = date?.value;

  if (value) {
    const year = value.slice(0, 4);

    return year && year !== '0001';
  }

  return false;
};

const DEFAULT_FORMAT_DATE: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

export const formatDate = (date?: Field<string>, lang = 'en', options = DEFAULT_FORMAT_DATE) => {
  if (date && showDateField(date)) {
    const currentTimeZoneOffset = new Date().getTimezoneOffset();
    const timeWithConversion = new Date(
      new Date(date.value).getTime() + currentTimeZoneOffset * 60000
    );
    return new Date(timeWithConversion).toLocaleDateString(lang, options);
  }

  return '';
};

export const formatUnixDate = (date?: Field<string>) => {
  if (showDateField(date)) {
    return parseInt((new Date(date!.value).getTime() / 1000).toFixed(0));
  }

  return '';
};

export const formatDateRange = ({ isoStart, isoEnd }: ProductIsoDates): string | undefined => {
  if (!isoStart || !isoEnd) {
    return;
  }
  // Check if the dates fall within the same month and year
  if (isoStart?.getFullYear() === isoEnd?.getFullYear()) {
    // same years
    const startDate = `${format(isoStart, 'LLL')} ${format(isoStart, 'd')}`;
    const sameMonthString = `${startDate} - ${format(isoEnd, 'd')}, ${format(isoStart, 'yyyy')}`;
    const notSameMonthString = `${startDate} - ${format(isoEnd, 'PP')}`;
    return isoStart.getMonth() === isoEnd.getMonth() ? sameMonthString : notSameMonthString;
  } else {
    // different years
    return `${format(isoStart, 'PP')} - ${format(isoEnd, 'PP')}`;
  }
};

export const sortStartEndDates = (dateRanges: ProductDate[]): ProductDate[] => {
  return dateRanges.sort((a, b) => {
    const startDateA = a.isoStart;
    const startDateB = b.isoStart;
    const endDateA = a.isoEnd;
    const endDateB = b.isoEnd;
    const startDatesPresent = startDateA && startDateB;
    const endDatesPresent = endDateA && endDateB;
    if (!startDatesPresent || !endDatesPresent) {
      return 0;
    }
    if (startDateA < startDateB) {
      return -1;
    } else if (startDateA > startDateB) {
      return 1;
    } else {
      // If start dates are equal, sort by end date
      if (endDateA < endDateB) {
        return -1;
      } else if (endDateA > endDateB) {
        return 1;
      } else {
        return 0;
      }
    }
  });
};

const getTotalMinutes = (hoursValue?: string | number, minutesValue?: string | number): number => {
  const tHours =
    (typeof hoursValue === 'string' ? hoursValue && parseInt(hoursValue, 10) : hoursValue) || 0;
  const tMinutes =
    (typeof minutesValue === 'string'
      ? minutesValue && parseInt(minutesValue, 10)
      : minutesValue) || 0;
  return tHours * 60 + tMinutes;
};

const ianaTimezoneMap: { [key: string]: string } = {
  PT: 'America/Los_Angeles',
  ET: 'America/New_York',
  MT: 'America/Denver',
  CT: 'America/Chicago',
  AT: 'America/Halifax',
  NT: 'America/St_Johns',
  CET: 'Europe/Berlin',
};

const parseNumericTimezone = (tz: string): number | null => {
  const match = tz.match(/^(?:GMT|UTC)?\s*([+-])\s*(\d{1,2})(?::(\d{2}))?$/i);
  if (!match) return null;
  const sign = match[1];
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] || '0', 10);
  const total = hours * 60 + minutes;
  return sign === '-' ? -total : total;
};

const getIANATimezoneOffset = (ianaTimezone: string, date: Date): number | null => {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0');
    const hour = get('hour') === 24 ? 0 : get('hour');
    const localAsUTC = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      hour,
      get('minute'),
      get('second')
    );
    return (localAsUTC - date.getTime()) / 60000;
  } catch {
    return null;
  }
};

const resolveTimezoneOffset = (timeZone: string, referenceDate: Date): number => {
  const tz = timeZone.trim();

  const numeric = parseNumericTimezone(tz);
  if (numeric !== null) return numeric;

  const directIANA = getIANATimezoneOffset(tz, referenceDate);
  if (directIANA !== null) return directIANA;

  const ianaName = ianaTimezoneMap[tz];
  if (ianaName) return getIANATimezoneOffset(ianaName, referenceDate) ?? 0;

  const exactData = timeZoneOffsets[tz];
  if (exactData) {
    const sign = exactData.slice(0, 1);
    const zoneTime = exactData.slice(1).split(':');
    const minutes = getTotalMinutes(zoneTime[0], zoneTime[1]);
    return sign === '-' ? -minutes : minutes;
  }

  const entry = Object.entries(timeZoneOffsets).find(([key]) => tz.includes(key));
  if (entry) {
    const data = entry[1];
    const sign = data.slice(0, 1);
    const zoneTime = data.slice(1).split(':');
    const minutes = getTotalMinutes(zoneTime[0], zoneTime[1]);
    return sign === '-' ? -minutes : minutes;
  }

  console.warn(`[getUTCTime] Unknown timezone: "${timeZone}". Treating time as UTC.`);
  return 0;
};

export const getUTCTime = ({
  time,
  date,
  timeZone,
}: {
  time?: string;
  date?: string;
  timeZone?: string;
}) => {
  if (!date) {
    return;
  }
  const itemDate = date ? new Date(date) : new Date();
  const timeZoneOffset = timeZone ? resolveTimezoneOffset(timeZone, itemDate) : 0;

  const [hoursUTC, minutesUTC] = time?.split(':')?.map(Number) || [0, 0];
  itemDate.setUTCMinutes(getTotalMinutes(hoursUTC, minutesUTC) - timeZoneOffset);
  const tYear = itemDate?.getUTCFullYear();
  const tMonth = itemDate?.getUTCMonth();
  const tDay = itemDate?.getUTCDate();
  const tHour = itemDate?.getUTCHours();
  const tMinutes = itemDate?.getUTCMinutes();
  const dateUTC = new Date(Date.UTC(tYear, tMonth, tDay, tHour, tMinutes));
  return dateUTC;
};

export const getWeekdayRange = ({
  isoStart,
  isoEnd,
  startTime,
  endTime,
  daysOfWeek,
}: ProductHit): string => {
  if (!isoStart || !isoEnd) {
    return '';
  }
  const isHasTime = Boolean(startTime && endTime);
  const getWeekdayName = (date: Date): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[date.getDay()];
  };

  const dayMilliseconds = 24 * 60 * 60 * 1000;
  const weekdays: string[] = [];
  const workingDaynames = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  for (let d = isoStart; d <= isoEnd; d = new Date(d.getTime() + dayMilliseconds)) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) {
      weekdays.push(getWeekdayName(d));
    }
  }

  // This is a safeguard in case we're missing time values from Algolia. However when we will create a global validation
  // function in checkout.tsx to filter out products with missing fields, this condition should no longer trigger.

  const startToEnd = formatTimeRange({ isoStart, isoEnd, isHasTime });

  const uniqueWeekdays = Array.from(new Set(weekdays));

  if (Boolean(daysOfWeek)) {
    return `${daysOfWeek}${startToEnd}`;
  } else if (
    uniqueWeekdays.length === 5 &&
    uniqueWeekdays.every((day) => workingDaynames.has(day))
  ) {
    return `Monday to Friday${startToEnd}`;
  } else if (uniqueWeekdays.length > 0) {
    return `${uniqueWeekdays[0]} to ${uniqueWeekdays[uniqueWeekdays.length - 1]}${startToEnd}`;
  } else {
    return 'No weekdays in range';
  }
};

export const formatTimeRange = ({
  isoStart,
  isoEnd,
  isHasTime,
}: {
  isoStart?: Date;
  isoEnd?: Date;
  isHasTime: boolean;
}): string | undefined => {
  let startToEnd = '';
  if (isHasTime && isoStart && isoEnd) {
    const start = `${format(isoStart, 'p')}`;
    const end = `${format(isoEnd, 'p')}`;
    startToEnd = `, ${start} to ${end}`;
  }
  return startToEnd;
};

export const getFullDatetimeRange = ({ isoStart, isoEnd }: ProductHit): string => {
  if (!isoStart || !isoEnd) {
    return '';
  }

  const dateRange = formatDateRange({ isoStart, isoEnd });
  const timeRange = formatTimeRange({ isoStart, isoEnd, isHasTime: true });

  return `${dateRange}${timeRange}`;
};

export const convertDateToReadableFormat = (dateString: string | undefined): string => {
  if (!dateString) {
    return '';
  }
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', DEFAULT_FORMAT_DATE);
};

export const getShortIsoDate = (date: Date, delimiter?: string) => {
  return date
    .toISOString()
    .split('T')[0]
    .replace(/-/g, delimiter || '-');
};
