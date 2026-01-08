/**
 * Timezone utility module
 * 
 * All date/time operations in this application are normalized to America/Los_Angeles timezone.
 * This ensures consistent behavior regardless of where the UI is accessed from.
 */

import { format, parse } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

// Fixed timezone for all operations - Crystal Cove is in California
export const APP_TIMEZONE = 'America/Los_Angeles';

/**
 * Converts a Date object to a YYYY-MM-DD string in the app timezone
 */
export function toAppDateString(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Parses a YYYY-MM-DD string as a date in the app timezone
 * Returns a Date object representing midnight on that date in the app timezone
 */
export function parseAppDateString(dateStr: string): Date {
  // Parse the date string and convert from app timezone to UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create a date at midnight in the app timezone
  return fromZonedTime(new Date(year, month - 1, day, 0, 0, 0, 0), APP_TIMEZONE);
}

/**
 * Gets the current date string in the app timezone (YYYY-MM-DD)
 */
export function getTodayInAppTimezone(): string {
  return toAppDateString(new Date());
}

/**
 * Gets the current Date object representing "now" in the app timezone context
 */
export function getNowInAppTimezone(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

/**
 * Converts a UTC Date or Firestore timestamp to app timezone Date
 */
export function toAppTimezoneDate(date: Date): Date {
  return toZonedTime(date, APP_TIMEZONE);
}

/**
 * Gets the hour (0-23) for a given Date in the app timezone
 */
export function getHourInAppTimezone(date: Date): number {
  const zonedDate = toZonedTime(date, APP_TIMEZONE);
  return zonedDate.getHours();
}

/**
 * Gets the minutes for a given Date in the app timezone
 */
export function getMinutesInAppTimezone(date: Date): number {
  const zonedDate = toZonedTime(date, APP_TIMEZONE);
  return zonedDate.getMinutes();
}

/**
 * Creates a Date object for a specific hour on a given date in app timezone
 */
export function createDateAtHourInAppTimezone(dateStr: string, hour: number, minute: number = 0): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const zonedDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return fromZonedTime(zonedDate, APP_TIMEZONE);
}

/**
 * Gets the date string (YYYY-MM-DD) for a timestamp in app timezone
 */
export function getDateStringInAppTimezone(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Formats a date for display in app timezone
 */
export function formatDateInAppTimezone(date: Date, formatStr: string): string {
  return formatInTimeZone(date, APP_TIMEZONE, formatStr);
}

/**
 * Compares two dates to check if they are the same day in app timezone
 */
export function isSameDayInAppTimezone(date1: Date, date2: Date): boolean {
  return getDateStringInAppTimezone(date1) === getDateStringInAppTimezone(date2);
}

/**
 * Gets start of day in app timezone as a UTC Date
 */
export function getStartOfDayInAppTimezone(date: Date): Date {
  const dateStr = getDateStringInAppTimezone(date);
  return parseAppDateString(dateStr);
}

/**
 * Gets end of day in app timezone as a UTC Date (23:59:59.999)
 */
export function getEndOfDayInAppTimezone(date: Date): Date {
  const dateStr = getDateStringInAppTimezone(date);
  const [year, month, day] = dateStr.split('-').map(Number);
  return fromZonedTime(new Date(year, month - 1, day, 23, 59, 59, 999), APP_TIMEZONE);
}

/**
 * Adds days to a date string and returns the new date string
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
