
import { format } from "date-fns";
import { SensorType, SENSOR_CONFIG } from "./mock-data";

export interface DateGroup {
  date: string;
  startIndex: number;
  position: number;
}

// Format time based on timestamp - now showing only hours
export function formatXAxisTick(timestamp: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return format(date, 'HH:00'); // Changed from 'HH:mm' to 'HH:00' to show only hours
}

// Format full date and time for tooltips
export function formatTooltipLabel(timestamp: string): string {
  if (!timestamp) return 'Invalid date';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';
  return format(date, 'yyyy-MM-dd HH:mm');
}

// Group data by date for multi-day display
export function groupDataByDate(data: { timestamp: Date }[]): DateGroup[] {
  if (data.length === 0) return [];
  
  // Create a Map to collect data points by date
  const dayGroups = new Map();
  
  // Sort data by timestamp to ensure chronological order
  const sortedData = [...data].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Process each data point to find unique days and their positions
  sortedData.forEach((item, index) => {
    const dateKey = item.timestamp.toISOString().split('T')[0];
    
    if (!dayGroups.has(dateKey)) {
      // For each unique date, store its first occurrence index
      dayGroups.set(dateKey, {
        date: format(item.timestamp, 'MMM dd'),
        startIndex: index,
        // Calculate position based on timestamp relative to start and end times
        position: (item.timestamp.getTime() - sortedData[0].timestamp.getTime()) / 
                (sortedData[sortedData.length - 1].timestamp.getTime() - sortedData[0].timestamp.getTime())
      });
    }
  });
  
  return Array.from(dayGroups.values());
}

// Check if data spans multiple days
export function dataSpansMultipleDays(data: { timestamp: Date }[]): boolean {
  if (data.length < 2) return false;
  
  const firstDay = data[0].timestamp.toISOString().split('T')[0];
  const lastDay = data[data.length - 1].timestamp.toISOString().split('T')[0];
  
  return firstDay !== lastDay;
}

// Format date for x-axis when showing dates instead of times
export function formatDateTick(timestamp: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return format(date, 'MMM dd');
}

// Get date transitions for adding reference lines and last positions for date labels
export function getDateTransitions(data: Array<{ timestamp: string; rawTimestamp: Date }>): Array<{ timestamp: string; date: string; centerTimestamp?: string }> {
  if (data.length === 0) return [];
  
  const transitions: Array<{ timestamp: string; date: string; centerTimestamp?: string }> = [];
  const dateRanges = new Map<string, { start: number; end: number; timestamps: string[] }>();
  
  // Group data by date and find ranges
  data.forEach((item, index) => {
    const dateKey = item.rawTimestamp.toISOString().split('T')[0];
    if (!dateRanges.has(dateKey)) {
      dateRanges.set(dateKey, { start: index, end: index, timestamps: [item.timestamp] });
    } else {
      const range = dateRanges.get(dateKey)!;
      range.end = index;
      range.timestamps.push(item.timestamp);
    }
  });
  
  // Create transitions between dates
  let currentDate = data[0].rawTimestamp.toISOString().split('T')[0];
  
  // Add last timestamps for each date range (aligned with last reading of each day)
  dateRanges.forEach((range, dateKey) => {
    // Use the last timestamp of the day instead of center
    const lastTimestamp = range.timestamps[range.timestamps.length - 1];
    
    // Find if this is a transition point (not the first date)
    if (dateKey !== currentDate) {
      transitions.push({
        timestamp: data[range.start].timestamp, // Transition point (first reading of new day)
        date: dateKey,
        centerTimestamp: lastTimestamp // Last reading of this day (for positioning date label)
      });
    }
  });
  
  // For the first date, we need to add its last timestamp separately
  const firstDateKey = data[0].rawTimestamp.toISOString().split('T')[0];
  const firstDateRange = dateRanges.get(firstDateKey);
  if (firstDateRange) {
    // Use the last timestamp of the first day
    const lastTimestamp = firstDateRange.timestamps[firstDateRange.timestamps.length - 1];
    
    // Add the first date's last reading to the beginning
    transitions.unshift({
      timestamp: data[0].timestamp,
      date: firstDateKey,
      centerTimestamp: lastTimestamp
    });
  }
  
  return transitions;
}
