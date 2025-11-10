
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

// Get date transitions for adding reference lines and center positions for date labels
export function getDateTransitions(data: Array<{ timestamp: string; rawTimestamp: Date }>): Array<{ timestamp: string; date: string; centerTimestamp?: string }> {
  if (data.length === 0) return [];
  
  const transitions: Array<{ timestamp: string; date: string; centerTimestamp?: string }> = [];
  const dateRanges = new Map<string, { start: number; end: number; timestamps: string[]; rawTimestamps: Date[] }>();
  
  // Group data by date and find ranges
  data.forEach((item, index) => {
    const dateKey = item.rawTimestamp.toISOString().split('T')[0];
    if (!dateRanges.has(dateKey)) {
      dateRanges.set(dateKey, { start: index, end: index, timestamps: [item.timestamp], rawTimestamps: [item.rawTimestamp] });
    } else {
      const range = dateRanges.get(dateKey)!;
      range.end = index;
      range.timestamps.push(item.timestamp);
      range.rawTimestamps.push(item.rawTimestamp);
    }
  });
  
  // Helper function to find the last reading of a day (the one with the highest hour)
  const findLastReadingOfDay = (range: { timestamps: string[]; rawTimestamps: Date[] }): string => {
    // Find the reading with the maximum hour value
    let maxHour = -1;
    let lastTimestamp = range.timestamps[range.timestamps.length - 1];
    
    range.rawTimestamps.forEach((rawTs, idx) => {
      const hour = rawTs.getHours();
      if (hour > maxHour) {
        maxHour = hour;
        lastTimestamp = range.timestamps[idx];
      }
    });
    
    return lastTimestamp;
  };
  
  // Create transitions between dates
  const dateKeys = Array.from(dateRanges.keys());
  
  // For each date, add center timestamp for label positioning
  dateKeys.forEach((dateKey, index) => {
    const range = dateRanges.get(dateKey)!;
    const centerIndex = Math.floor(range.timestamps.length / 2);
    const centerTimestamp = range.timestamps[centerIndex];
    
    // For the vertical line: use the last reading (highest hour) of the previous day
    let lineTimestamp: string;
    if (index === 0) {
      // First day: no line before it, use first timestamp as placeholder
      lineTimestamp = data[0].timestamp;
    } else {
      // Get the last reading (highest hour) of the previous day
      const prevDateKey = dateKeys[index - 1];
      const prevRange = dateRanges.get(prevDateKey)!;
      lineTimestamp = findLastReadingOfDay(prevRange);
    }
    
    transitions.push({
      timestamp: lineTimestamp, // Vertical line at last reading of previous day
      date: dateKey,
      centerTimestamp: centerTimestamp // Date label at center of current day
    });
  });
  
  return transitions;
}
