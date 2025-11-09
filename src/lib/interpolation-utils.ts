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
 * Interpolates a missing reading by averaging the closest readings on left and right
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
  
  // Find closest reading on the left (earlier time)
  let leftReading: SensorData | null = null;
  for (let i = sortedReadings.length - 1; i >= 0; i--) {
    const readingDate = new Date(sortedReadings[i].timestamp);
    if (readingDate.getHours() < missingHour) {
      leftReading = sortedReadings[i];
      break;
    }
  }
  
  // Find closest reading on the right (later time)
  let rightReading: SensorData | null = null;
  for (let i = 0; i < sortedReadings.length; i++) {
    const readingDate = new Date(sortedReadings[i].timestamp);
    if (readingDate.getHours() > missingHour) {
      rightReading = sortedReadings[i];
      break;
    }
  }
  
  // If we have both left and right readings, interpolate
  if (leftReading && rightReading) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const interpolatedTimestamp = new Date(year, month - 1, day, missingHour, 0, 0);
    
    return {
      timestamp: interpolatedTimestamp,
      value: (leftReading.value + rightReading.value) / 2,
      type: leftReading.type, // Use the type from existing readings
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
    
    // Check for missing hours (10-17) and interpolate
    for (let hour = 10; hour <= 17; hour++) {
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
