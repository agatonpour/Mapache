
import { 
  collection, 
  getDocs,
  doc,
  Timestamp,
  orderBy,
  query,
  where,
  limit
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
  battery_percent: number;
  solar_watts: number;
  awake_hhmm: string;
  timestamp: string | Timestamp; // ISO string or Firestore timestamp
}

// Interface for the status data (battery, solar, awake time)
export interface StatusData {
  battery_percent: number;
  solar_watts: number;
  awake_hhmm: string;
  timestamp: Date;
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
        value: reading.humidity_percent / 10, // Store humidity as 0-10 range, will be displayed as 0-100%
        timestamp 
      });
      
      result.pressure.push({ 
        type: 'pressure', 
        value: reading.pressure_pa, // Store the original value, transformations happen in display components
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

// Function to get the latest status data (battery, solar, awake time)
export async function fetchLatestStatusData(): Promise<StatusData | null> {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Try to get data from today first
    let dateDoc = doc(db, "raccoonbot_data", today);
    let readingsCollectionRef = collection(dateDoc, "readings");
    let q = query(readingsCollectionRef, orderBy("timestamp", "desc"), limit(1));
    let querySnapshot = await getDocs(q);
    
    // If no data for today, try the last 7 days
    if (querySnapshot.empty) {
      console.log("No status data found for today, searching recent days...");
      
      for (let i = 1; i <= 7; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        const pastDateStr = pastDate.toISOString().split('T')[0];
        
        dateDoc = doc(db, "raccoonbot_data", pastDateStr);
        readingsCollectionRef = collection(dateDoc, "readings");
        q = query(readingsCollectionRef, orderBy("timestamp", "desc"), limit(1));
        querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`Found status data from ${pastDateStr}`);
          break;
        }
      }
    }
    
    if (querySnapshot.empty) {
      console.log("No status data found in the last 7 days");
      // Return default values instead of null
      return {
        battery_percent: 0,
        solar_watts: 0,
        awake_hhmm: "0:00",
        timestamp: new Date()
      };
    }
    
    // Get the most recent reading
    const latestDoc = querySnapshot.docs[0];
    const reading = latestDoc.data() as FirestoreReading;
    
    // Convert timestamp to JavaScript Date
    const timestamp = typeof reading.timestamp === 'string' 
      ? new Date(reading.timestamp)
      : reading.timestamp.toDate();
    
    return {
      battery_percent: reading.battery_percent || 0,
      solar_watts: reading.solar_watts || 0,
      awake_hhmm: reading.awake_hhmm || "0:00",
      timestamp
    };
  } catch (error) {
    console.error("Error fetching latest status data:", error);
    // Return default values instead of null
    return {
      battery_percent: 0,
      solar_watts: 0,
      awake_hhmm: "0:00",
      timestamp: new Date()
    };
  }
}

// Function to filter readings by timeframe
export function filterReadingsByTimeframe(
  readings: Record<SensorType, SensorData[]>, 
  timeframe: string
): Record<SensorType, SensorData[]> {
  // We're not going to filter by timeframe anymore, just return all readings
  return readings;
}
