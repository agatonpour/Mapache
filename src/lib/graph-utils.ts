
import { format } from "date-fns";
import { SensorType, SENSOR_CONFIG } from "./mock-data";

export interface DateGroup {
  date: string;
  startIndex: number;
  position: number;
}

// Format time based on timestamp - now showing only hours
export function formatXAxisTick(timestamp: string): string {
  const date = new Date(timestamp);
  return format(date, 'HH:00'); // Changed from 'HH:mm' to 'HH:00' to show only hours
}

// Format full date and time for tooltips
export function formatTooltipLabel(timestamp: string): string {
  const date = new Date(timestamp);
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
