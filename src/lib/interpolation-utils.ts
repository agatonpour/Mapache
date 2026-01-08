import { SensorData } from "./mock-data";
import {
  getDateStringInAppTimezone,
  getHourInAppTimezone,
  getMinutesInAppTimezone,
  getTodayInAppTimezone,
  getNowInAppTimezone,
  createDateAtHourInAppTimezone
} from "./timezone-utils";

/**
 * Checks if a reading falls within the acceptable window for a given hour (within 10 minutes after)
 * Uses app timezone for hour calculations
 */
function isReadingForHour(timestamp: Date, targetHour: number): boolean {
  const hour = getHourInAppTimezone(timestamp);
  const minutes = getMinutesInAppTimezone(timestamp);
  
  // Reading should be at the hour mark or within 10 minutes after
  return hour === targetHour && minutes <= 10;
}

/**
 * Groups readings by date (YYYY-MM-DD format) in app timezone
 */
function groupReadingsByDate(readings: SensorData[]): Record<string, SensorData[]> {
  const grouped: Record<string, SensorData[]> = {};
  
  readings.forEach(reading => {
    const dateKey = getDateStringInAppTimezone(reading.timestamp);
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(reading);
  });
  
  return grouped;
}

/**
 * Finds which hours (10-17) have readings for a given day
 * Uses app timezone for hour calculations
 */
function findPresentHours(readings: SensorData[]): Set<number> {
  const presentHours = new Set<number>();
  
  readings.forEach(reading => {
    // Check each expected hour (10-17)
    for (let targetHour = 10; targetHour <= 17; targetHour++) {
      if (isReadingForHour(reading.timestamp, targetHour)) {
        presentHours.add(targetHour);
        break;
      }
    }
  });
  
  return presentHours;
}

/**
 * Interpolates a missing reading by averaging neighboring readings
 * - For middle hours: average left and right readings
 * - For first hour (10:00): average two earliest readings
 * - For last hour (17:00): average two latest readings
 */
function interpolateReading(
  missingHour: number,
  dateKey: string,
  readings: SensorData[]
): SensorData | null {
  // Sort readings by timestamp
  const sortedReadings = [...readings].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  if (sortedReadings.length < 2) {
    return null; // Need at least 2 readings to interpolate
  }
  
  // Find closest reading on the left (earlier time)
  let leftReading: SensorData | null = null;
  for (let i = sortedReadings.length - 1; i >= 0; i--) {
    const readingHour = getHourInAppTimezone(sortedReadings[i].timestamp);
    if (readingHour < missingHour) {
      leftReading = sortedReadings[i];
      break;
    }
  }
  
  // Find closest reading on the right (later time)
  let rightReading: SensorData | null = null;
  for (let i = 0; i < sortedReadings.length; i++) {
    const readingHour = getHourInAppTimezone(sortedReadings[i].timestamp);
    if (readingHour > missingHour) {
      rightReading = sortedReadings[i];
      break;
    }
  }
  
  // Create interpolated timestamp at the missing hour in app timezone
  const interpolatedTimestamp = createDateAtHourInAppTimezone(dateKey, missingHour, 0);
  
  // Case 1: No readings before this hour - use two earliest readings
  if (!leftReading && sortedReadings.length >= 2) {
    const value = (sortedReadings[0].value + sortedReadings[1].value) / 2;
    return {
      timestamp: interpolatedTimestamp,
      value,
      type: sortedReadings[0].type,
    };
  }
  
  // Case 2: No readings after this hour - use two latest readings
  if (!rightReading && sortedReadings.length >= 2) {
    const lastIdx = sortedReadings.length - 1;
    const value = (sortedReadings[lastIdx].value + sortedReadings[lastIdx - 1].value) / 2;
    return {
      timestamp: interpolatedTimestamp,
      value,
      type: sortedReadings[lastIdx].type,
    };
  }
  
  // Case 3: Middle reading - we have readings on both sides
  if (leftReading && rightReading) {
    return {
      timestamp: interpolatedTimestamp,
      value: (leftReading.value + rightReading.value) / 2,
      type: leftReading.type,
    };
  }
  
  return null;
}

/**
 * Fills in missing hourly readings (10:00-17:00) for each day using interpolation
 * All time calculations use app timezone (America/Los_Angeles)
 */
export function fillMissingHourlyReadings(readings: SensorData[]): SensorData[] {
  if (readings.length === 0) return readings;
  
  // Group readings by date in app timezone
  const groupedByDate = groupReadingsByDate(readings);
  
  const allReadings: SensorData[] = [];
  
  // Process each date
  Object.keys(groupedByDate).forEach(dateKey => {
    const dayReadings = groupedByDate[dateKey];
    const presentHours = findPresentHours(dayReadings);
    
    // Add existing readings
    allReadings.push(...dayReadings);
    
    // Determine if this is today in app timezone and what the current hour is
    const todayKey = getTodayInAppTimezone();
    const isToday = dateKey === todayKey;
    const currentHourInAppTz = getHourInAppTimezone(getNowInAppTimezone());
    
    // Check for missing hours (10-17) and interpolate
    // For today, only interpolate up to the current hour in app timezone
    const maxHour = isToday ? Math.min(17, currentHourInAppTz) : 17;
    
    for (let hour = 10; hour <= maxHour; hour++) {
      if (!presentHours.has(hour)) {
        const interpolated = interpolateReading(hour, dateKey, dayReadings);
        if (interpolated) {
          allReadings.push(interpolated);
        }
      }
    }
  });
  
  // Sort all readings by timestamp
  return allReadings.sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
}