import { SensorData } from "./mock-data";

// Manual override for expected interval (in milliseconds) - set to null to use auto-detection
export const MANUAL_EXPECTED_INTERVAL_MS: number | null = null;

// Multiplier for gap detection - gaps larger than this times the expected interval will be interpolated
export const GAP_THRESHOLD_MULTIPLIER = 2;

export interface InterpolatedSensorData extends SensorData {
  isInterpolated?: boolean;
}

/**
 * Calculate the mode (most common value) of time differences between consecutive data points
 */
export function calculateExpectedInterval(data: SensorData[]): number {
  if (data.length < 2) {
    return 0;
  }

  // Sort data by timestamp to ensure correct ordering
  const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Calculate time differences in milliseconds
  const timeDiffs: number[] = [];
  for (let i = 1; i < sortedData.length; i++) {
    const diff = sortedData[i].timestamp.getTime() - sortedData[i - 1].timestamp.getTime();
    timeDiffs.push(diff);
  }

  // Find the mode (most common difference)
  const diffCounts = new Map<number, number>();
  timeDiffs.forEach(diff => {
    // Round to nearest second to handle minor timing variations
    const roundedDiff = Math.round(diff / 1000) * 1000;
    diffCounts.set(roundedDiff, (diffCounts.get(roundedDiff) || 0) + 1);
  });

  // Find the most common difference
  let maxCount = 0;
  let expectedInterval = 0;
  diffCounts.forEach((count, diff) => {
    if (count > maxCount) {
      maxCount = count;
      expectedInterval = diff;
    }
  });

  console.log(`Calculated expected interval: ${expectedInterval}ms (${expectedInterval / 1000}s)`);
  console.log(`Time difference distribution:`, Object.fromEntries(diffCounts));
  
  return expectedInterval;
}

/**
 * Linear interpolation between two values
 */
function linearInterpolate(startValue: number, endValue: number, ratio: number): number {
  return startValue + (endValue - startValue) * ratio;
}

/**
 * Add interpolated data points for gaps in the time series
 */
export function interpolateGaps(
  data: SensorData[], 
  expectedIntervalMs?: number
): InterpolatedSensorData[] {
  if (data.length < 2) {
    return data;
  }

  // Use manual override if set, otherwise calculate from data
  const effectiveExpectedInterval = MANUAL_EXPECTED_INTERVAL_MS || 
    expectedIntervalMs || 
    calculateExpectedInterval(data);

  if (effectiveExpectedInterval === 0) {
    console.warn("Could not determine expected interval, returning original data");
    return data;
  }

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const result: InterpolatedSensorData[] = [];
  
  // Add first data point
  result.push(sortedData[0]);

  // Process each consecutive pair
  for (let i = 1; i < sortedData.length; i++) {
    const prevPoint = sortedData[i - 1];
    const currentPoint = sortedData[i];
    
    const timeDiff = currentPoint.timestamp.getTime() - prevPoint.timestamp.getTime();
    const gapThreshold = effectiveExpectedInterval * GAP_THRESHOLD_MULTIPLIER;
    
    // If gap is significant, add interpolated points at expectedInterval steps
    if (timeDiff > gapThreshold) {
      console.log(`Detected gap of ${timeDiff}ms (threshold: ${gapThreshold}ms), interpolating...`);
      
      // Add interpolated points at every expectedIntervalMs step
      let currentTime = prevPoint.timestamp.getTime() + effectiveExpectedInterval;
      const endTime = currentPoint.timestamp.getTime();
      
      while (currentTime < endTime) {
        const timeRatio = (currentTime - prevPoint.timestamp.getTime()) / timeDiff;
        const interpolatedTimestamp = new Date(currentTime);
        const interpolatedValue = linearInterpolate(
          prevPoint.value, 
          currentPoint.value, 
          timeRatio
        );
        
        result.push({
          type: prevPoint.type,
          value: interpolatedValue,
          timestamp: interpolatedTimestamp,
          isInterpolated: true
        });
        
        currentTime += effectiveExpectedInterval;
      }
    }
    
    // Add the current data point
    result.push(currentPoint);
  }

  const addedPoints = result.length - data.length;
  if (addedPoints > 0) {
    console.log(`Added ${addedPoints} interpolated points to fill gaps`);
  }

  return result;
}

/**
 * Apply interpolation to all sensor types in a data record
 */
export function interpolateAllSensorData(
  sensorData: Record<string, SensorData[]>
): Record<string, InterpolatedSensorData[]> {
  const result: Record<string, InterpolatedSensorData[]> = {};
  
  Object.keys(sensorData).forEach(sensorType => {
    const data = sensorData[sensorType];
    result[sensorType] = interpolateGaps(data);
  });
  
  return result;
}