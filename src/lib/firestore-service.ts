
import { 
  collection, 
  getDocs,
  doc,
  Timestamp,
  orderBy,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { SensorData, SensorType } from "./mock-data";

// Define the shape of a reading from Firestore
export interface FirestoreReading {
  aqi: number;
  temp_c: number;
  humidity_percent: number;
  pressure_pa: number;
  tvoc_ppb: number;
  eco2_ppm: number;
  timestamp: string | Timestamp; // ISO string or Firestore timestamp
}

// Function to fetch readings for a specific date range
export async function fetchReadingsForDateRange(startDateStr: string, endDateStr: string): Promise<Record<SensorType, SensorData[]>> {
  try {
    console.log(`Fetching readings from ${startDateStr} to ${endDateStr}`);
    
    // Initialize the result object with empty arrays for each sensor type
    const result: Record<SensorType, SensorData[]> = {
      aqi: [],
      temperature: [],
      humidity: [],
      pressure: [],
      tvoc: [],
      eco2: []
    };
    
    // Convert string dates to Date objects
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    
    // Iterate through each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Get readings for this specific date
      const dateReadings = await fetchReadingsForDate(dateStr);
      
      // Merge the readings into our result
      Object.keys(dateReadings).forEach((key) => {
        const sensorType = key as SensorType;
        result[sensorType] = [...result[sensorType], ...dateReadings[sensorType]];
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sort all readings by timestamp
    Object.keys(result).forEach((key) => {
      const sensorType = key as SensorType;
      result[sensorType].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });
    
    return result;
  } catch (error) {
    console.error(`Error fetching readings for date range ${startDateStr} to ${endDateStr}:`, error);
    // Return empty data on error
    return {
      aqi: [],
      temperature: [],
      humidity: [],
      pressure: [],
      tvoc: [],
      eco2: []
    };
  }
}

// Function to fetch readings from a specific date
export async function fetchReadingsForDate(dateStr: string): Promise<Record<SensorType, SensorData[]>> {
  try {
    console.log(`Fetching readings for date: ${dateStr}`);
    
    // Get reference to the specific date document
    const dateDoc = doc(db, "raccoonbot_data", dateStr);
    
    // Get reference to the 'readings' subcollection
    const readingsCollectionRef = collection(dateDoc, "readings");
    
    // Query to get all documents from the subcollection, ordered by timestamp
    const q = query(readingsCollectionRef, orderBy("timestamp"));
    
    // Fetch the documents
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} readings for date ${dateStr}`);
    
    // Initialize the result object with empty arrays for each sensor type
    const result: Record<SensorType, SensorData[]> = {
      aqi: [],
      temperature: [],
      humidity: [],
      pressure: [],
      tvoc: [],
      eco2: []
    };
    
    // Process each reading document
    querySnapshot.forEach((doc) => {
      const reading = doc.data() as FirestoreReading;
      
      // Convert timestamp to JavaScript Date
      const timestamp = typeof reading.timestamp === 'string' 
        ? new Date(reading.timestamp)
        : reading.timestamp.toDate();
      
      // Add data points for each sensor type
      result.aqi.push({ 
        type: 'aqi', 
        value: reading.aqi, 
        timestamp 
      });
      
      result.temperature.push({ 
        type: 'temperature', 
        value: reading.temp_c, 
        timestamp 
      });
      
      result.humidity.push({ 
        type: 'humidity', 
        value: reading.humidity_percent / 10, // Dividing by 10 as it will be multiplied in SensorCard
        timestamp 
      });
      
      result.pressure.push({ 
        type: 'pressure', 
        value: reading.pressure_pa / 10, // Dividing by 10 for proper display (corrected)
        timestamp 
      });
      
      result.tvoc.push({ 
        type: 'tvoc', 
        value: reading.tvoc_ppb, 
        timestamp 
      });
      
      result.eco2.push({ 
        type: 'eco2', 
        value: reading.eco2_ppm, 
        timestamp 
      });
    });
    
    return result;
  } catch (error) {
    console.error(`Error fetching readings for date ${dateStr}:`, error);
    // Return empty data on error
    return {
      aqi: [],
      temperature: [],
      humidity: [],
      pressure: [],
      tvoc: [],
      eco2: []
    };
  }
}

// Function to filter readings by timeframe
export function filterReadingsByTimeframe(
  readings: Record<SensorType, SensorData[]>, 
  timeframe: string
): Record<SensorType, SensorData[]> {
  const now = new Date();
  let cutoffTime = new Date();
  
  switch (timeframe) {
    case '3m':
      cutoffTime.setMinutes(now.getMinutes() - 3);
      break;
    case '15m':
      cutoffTime.setMinutes(now.getMinutes() - 15);
      break;
    case '1h':
      cutoffTime.setHours(now.getHours() - 1);
      break;
    case '6h':
      cutoffTime.setHours(now.getHours() - 6);
      break;
    case '1d':
      cutoffTime.setDate(now.getDate() - 1);
      break;
    case '7d':
      cutoffTime.setDate(now.getDate() - 7);
      break;
    case '30d':
      cutoffTime.setDate(now.getDate() - 30);
      break;
    default:
      // Default to all data
      return readings;
  }
  
  const filteredReadings: Record<SensorType, SensorData[]> = {
    aqi: [],
    temperature: [],
    humidity: [],
    pressure: [],
    tvoc: [],
    eco2: []
  };
  
  // Filter each sensor type array
  Object.keys(readings).forEach((key) => {
    const sensorType = key as SensorType;
    filteredReadings[sensorType] = readings[sensorType].filter(
      reading => reading.timestamp >= cutoffTime
    );
  });
  
  return filteredReadings;
}
