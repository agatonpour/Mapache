import { SensorData } from "./mock-data";

/**
 * Checks if a reading falls within the acceptable window for a given hour (within 10 minutes after)
 */
function isReadingForHour(timestamp: Date, targetHour: number): boolean {
  const hour = timestamp.getHours();
  const minutes = timestamp.getMinutes();
  
  // Reading should be at the hour mark or within 10 minutes after
  return hour === targetHour && minutes <= 10;
}

/**
 * Groups readings by date (YYYY-MM-DD format)
 */
function groupReadingsByDate(readings: SensorData[]): Record<string, SensorData[]> {
  const grouped: Record<string, SensorData[]> = {};
  
  readings.forEach(reading => {
    const date = new Date(reading.timestamp);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(reading);
  });
  
  return grouped;
}

/**
 * Finds which hours (10-17) have readings for a given day
 */
function findPresentHours(readings: SensorData[]): Set<number> {
  const presentHours = new Set<number>();
  
  readings.forEach(reading => {
    const date = new Date(reading.timestamp);
    const hour = date.getHours();
    
    // Check each expected hour (10-17)
    for (let targetHour = 10; targetHour <= 17; targetHour++) {
      if (isReadingForHour(date, targetHour)) {
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
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  if (sortedReadings.length < 2) {
    return null; // Need at least 2 readings to interpolate
  }
  
  // Find closest reading on the left (earlier time)
  let leftReading: SensorData | null = null;
  let leftIndex = -1;
  for (let i = sortedReadings.length - 1; i >= 0; i--) {
    const readingDate = new Date(sortedReadings[i].timestamp);
    if (readingDate.getHours() < missingHour) {
      leftReading = sortedReadings[i];
      leftIndex = i;
      break;
    }
  }
  
  // Find closest reading on the right (later time)
  let rightReading: SensorData | null = null;
  let rightIndex = -1;
  for (let i = 0; i < sortedReadings.length; i++) {
    const readingDate = new Date(sortedReadings[i].timestamp);
    if (readingDate.getHours() > missingHour) {
      rightReading = sortedReadings[i];
      rightIndex = i;
      break;
    }
  }
  
  const [year, month, day] = dateKey.split('-').map(Number);
  const interpolatedTimestamp = new Date(year, month - 1, day, missingHour, 0, 0);
  
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
 */
export function fillMissingHourlyReadings(readings: SensorData[]): SensorData[] {
  if (readings.length === 0) return readings;
  
  // Group readings by date
  const groupedByDate = groupReadingsByDate(readings);
  
  const allReadings: SensorData[] = [];
  
  // Process each date
  Object.keys(groupedByDate).forEach(dateKey => {
    const dayReadings = groupedByDate[dateKey];
    const presentHours = findPresentHours(dayReadings);

    // Add existing readings
    allReadings.push(...dayReadings);

    // If there are no "expected window" readings at all, don't fabricate a whole day
    // (prevents creating daytime points from unrelated midnight/early-morning samples).
    if (presentHours.size === 0) {
      return;
    }

    // Determine interpolation window based on actually-present expected hours
    const minPresentHour = Math.min(...Array.from(presentHours));
    const maxPresentHourRaw = Math.max(...Array.from(presentHours));

    // Determine if this is today and what the current hour is
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = dateKey === todayKey;
    const currentHour = now.getHours();

    // For today, never interpolate beyond the current hour; never beyond 17.
    const maxPresentHour = isToday ? Math.min(17, currentHour, maxPresentHourRaw) : Math.min(17, maxPresentHourRaw);

    // Check for missing hours in the interpolatable window and interpolate
    for (let hour = minPresentHour; hour <= maxPresentHour; hour++) {
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
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
