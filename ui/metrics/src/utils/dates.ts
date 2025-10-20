import dayjs from "dayjs";

export enum PeriodType {
  month = "month",
  week = "week",
  day = "day",
  hour = "hour",
  year = "year",
}

// Simple Dates (as ISO string) relative to today
//-----------------------------------------------
/** today's date as a string yyyy-MM-dd */
export const getToday = () => new Date().toISOString().substring(0, 10);
/** current month date as string yyyy-MM-01 */
export const getCurrentMonth = () => new Date().toISOString().substring(0, 8) + "01";
/** 14 days ago, as string yyyy-MM0dd */
export const getDaysAgo14 = () => dayjs().add(-14, "day").toISOString().substring(0, 10);

// Things that return date strings (yyyy-MM-dd or yyyy-MM-01)
//-----------------------------------------------------------
/** given a number of years, returns the start of month for it relative to today.
 * example: today is 2024-04-16, given 1, returns 2023-04-01.
 */
export const getMonthForYearsAgo = (years?: string | number): string => {
  if (!years) {
    return getCurrentMonth();
  }
  const yearNumber = +years;
  if (isNaN(yearNumber)) {
    return getCurrentMonth();
  }
  return dayjs().add(-yearNumber, "year").startOf("month").toISOString().substring(0, 10);
};
/** given a number of months, returns the start of month for it relative to today.
 * example: today is 2024-04-16, given 12, returns 2023-04-01.
 */
export const getMonthForMonthsAgo = (months?: string | number): string => {
  if (!months) {
    return getCurrentMonth();
  }
  const monthNumber = +months;
  if (isNaN(monthNumber)) {
    return getCurrentMonth();
  }
  return dayjs().add(-monthNumber, "month").startOf("month").toISOString().substring(0, 10);
};
/** given a potential date string, return the month for it as an ISO string (yyyy-MM-01) */
export const getMonthDateForString = (date?: string): string | undefined => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return undefined;
  }
  return d.startOf("month").toISOString().substring(0, 8) + "01";
};
/** given a potential date string, return the week for it as an ISO string (yyyy-MM-dd) */
export const getWeekDateForString = (date?: string): string | undefined => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return undefined;
  }
  return d.startOf("week").toISOString().substring(0, 10);
};
/** given a potential date string, return the week for it as an ISO string (yyyy-MM-dd) */
export const getYearDateForString = (date?: string): string | undefined => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return undefined;
  }
  return d.startOf("year").toISOString().substring(0, 10);
};
/** given a potential date string, return an ISO string (yyyy-MM-dd) */
export const getDateForString = (date?: string): string | undefined => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return undefined;
  }
  return d.toISOString().substring(0, 10);
};
/** given an unknown input, returns yyyy-MM-dd if it is a date */
export const getDateStringForUnknown = (date?: unknown): string => {
  if (typeof date === "string") {
    return getDateForString(date) || "";
  }
  return "";
};

// Things that return timestamp strings (yyyy-MM-ddTHH:00:00.0)
//------------------------------------------------------------
/** given a potential date string, return the hour for it as an ISO string (yyyy-MM-ddTHH:00:00.0) */
export const getHourDateForString = (date?: string): string | undefined => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return undefined;
  }
  return d.startOf("hour").toISOString().substring(0, 13) + ":00:00.0";
};
/** given a potential date string, return the ISO string for it (yyyy-MM-ddTHH:00:00.0) */
export const getISOForString = (date?: string): string => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return "";
  }
  return d.toISOString().substring(0, 19) + ".0";
};
/** given a potential date string, return the ISO string for it, stripping off tz info (yyyy-MM-ddTHH:00:00.0) */
export const getLocalISOForString = (date?: string): string => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return "";
  }
  return d.format().substring(0, 19) + ".0";
};
/** given a potential date string, return the ISO string for it, stripping off tz info (yyyy-MM-ddTHH:00:00.0) */
export const getLocalISOForDate = (date?: Date): string => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return "";
  }
  return d.format().substring(0, 19) + ".0";
};
/** given a potential date string, return the ISO string for it, with tz info (yyyy-MM-ddTHH:00:00.0Z) */
export const getISOForStringTz = (date?: string): string => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return "";
  }
  return d.format();
};

// Get all periods (as ISO strings) between two periods
/** given a start month (ISO string) and optional endMonth (ISO string),
 * return an array of all months in between (inclusive) as ISO strings yyyy-MM-01
 */
export const getAllMonths = (startMonth?: string, endMonth?: string): string[] => {
  let start = dayjs(startMonth);
  if (!start.isValid()) {
    return [];
  }
  start = start.startOf("month");
  const end = endMonth ? dayjs(endMonth) : dayjs(getToday());
  if (!end.isValid()) {
    return [];
  }
  let counter = 0;
  const periods: string[] = [];
  while (start.valueOf() <= end.valueOf() && counter < 720) {
    counter += 1;
    periods.push(start.toISOString().substring(0, 10));
    start = start.add(1, "month");
  }
  return periods;
};
/** given a start date (ISO string) and optional end date (ISO string),
 * return an array of all dates in between (inclusive) as ISO strings yyyy-MM-dd
 */
export const getAllDays = (startPeriod?: string, endPeriod?: string): string[] => {
  let start = dayjs(startPeriod);
  if (!start.isValid()) {
    return [];
  }
  const end = endPeriod ? dayjs(endPeriod) : dayjs(getCurrentMonth());
  if (!end.isValid()) {
    return [];
  }
  let counter = 0;
  const months: string[] = [];
  while (start.valueOf() <= end.valueOf() && counter < 121) {
    counter += 1;
    months.push(start.toISOString().substring(0, 10));
    start = start.add(1, "day");
  }
  return months;
};
/** given a start period (ISO string) and optional end period (ISO string),
 * return an array of all weeks in between (inclusive) as ISO strings yyyy-MM-dd
 */
export const getAllWeeks = (startPeriod?: string, endPeriod?: string): string[] => {
  let start = dayjs(startPeriod);
  if (!start.isValid()) {
    return [];
  }
  start = start.startOf("week");
  const end = endPeriod ? dayjs(endPeriod) : dayjs(getCurrentMonth());
  if (!end.isValid()) {
    return [];
  }
  let counter = 0;
  const periods: string[] = [];
  while (start.valueOf() <= end.valueOf() && counter < 300) {
    counter += 1;
    periods.push(start.toISOString().substring(0, 10));
    start = start.add(1, "week");
  }
  return periods;
};
/** given a start period (ISO string) and optional end period (ISO string),
 * return an array of all weeks in between (inclusive) as ISO strings yyyy-MM-ddTHH:00:00.0
 */
export const getAllHours = (startPeriod?: string, endPeriod?: string): string[] => {
  let start = dayjs(startPeriod);
  if (!start.isValid()) {
    return [];
  }
  start = start.startOf("hour");
  const end = endPeriod ? dayjs(endPeriod) : dayjs(getCurrentMonth());
  if (!end.isValid()) {
    return [];
  }
  let counter = 0;
  const periods: string[] = [];
  while (start.valueOf() <= end.valueOf() && counter < 300) {
    counter += 1;
    periods.push(start.toISOString().substring(0, 13) + ":00:00.0");
    start = start.add(1, "hour");
  }
  return periods;
};
/** given a start and end period and a period type, returns all periods in between */
export const getAllPeriods = (
  periodType: PeriodType,
  startPeriod?: string,
  endPeriod?: string,
): string[] => {
  switch (periodType) {
    case PeriodType.month:
      return getAllMonths(startPeriod, endPeriod);
    case PeriodType.day:
      return getAllDays(startPeriod, endPeriod);
    case PeriodType.week:
      return getAllWeeks(startPeriod, endPeriod);
    case PeriodType.hour:
      return getAllHours(startPeriod, endPeriod);
  }
  return [];
};
/** given a potential date string and period type, truncates that date to the given period */
export const truncDateString = (
  date: string | undefined,
  periodType: PeriodType,
): string | undefined => {
  let periodFunction = getDateForString;
  switch (periodType) {
    case PeriodType.month:
      periodFunction = getMonthDateForString;
      break;
    case PeriodType.week:
      periodFunction = getWeekDateForString;
      break;
    case PeriodType.hour:
      periodFunction = getHourDateForString;
      break;
    case PeriodType.year:
      periodFunction = getYearDateForString;
  }
  return periodFunction(date);
};

// Things that return a date
//--------------------------
/** given a potential date string, returns it as a Date, or undefined */
export const getDateFromString = (date?: string): Date | undefined => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return undefined;
  }
  return d.toDate();
};
/** returns a Date for number of days since current date */
export const getDayForDaysAgo = (days?: string | number): Date => {
  if (!days) {
    return new Date();
  }
  const asNum = +days;
  if (!asNum) {
    return new Date();
  }
  return dayjs().add(-asNum, "days").toDate();
};
/** add the given ms to the provided date. Returns now if invalid date provided */
export const addMsToDate = (date?: string, ms?: string | number): Date => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return new Date();
  }
  if (!ms) {
    return d.toDate();
  }
  const asNum = +ms;
  return d.add(asNum, "ms").toDate();
};

// Labels
//-------
/** given a Date, returns a chart label to minutes */
export const getDateTimeLabel = (x?: Date): string => {
  if (!x || !(x instanceof Date)) {
    return "";
  }
  return dayjs(x).format("YYYY-MM-DD hh:mma");
};
/** given a Date, returns a chart label to seconds */
export const getDateTimeLabelS = (x?: Date): string => {
  if (!x || !(x instanceof Date)) {
    return "";
  }
  return dayjs(x).format("YYYY-MM-DD hh:mm:ssa");
};
/** given a potential date string, return a short month name for it, yyyy MMM */
export const getShortMonth = (date?: string): string => {
  const d = dayjs(date);
  if (!d.isValid()) {
    return "";
  }
  return d.format("YYYY MMM");
};
