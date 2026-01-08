
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
import { SensorData, SensorType, StatusSensorType } from "./mock-data";
import {
  toAppDateString,
  getTodayInAppTimezone,
  getDateStringInAppTimezone,
  addDaysToDateString,
  toAppTimezoneDate
} from "./timezone-utils";

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
  soc_percent: number;
  battery_voltage_v: number;
  solar_power_w: number;
  solar_voltage_v: number;
  solar_current_ma: number;
  solar_current_a?: number; // Alternative field name for Amps
  alive_hhmm: string;
  timestamp: string | Timestamp; // ISO string or Firestore timestamp
}

// Interface for the status data (battery, solar, awake time)
export interface StatusData {
  soc_percent: number;
  solar_watts: number;
  awake_hhmm: string;
  timestamp: Date;
}

// Function to fetch readings for a specific date range
// Note: startDateStr and endDateStr are in YYYY-MM-DD format and represent dates in America/Los_Angeles timezone
export async function fetchReadingsForDateRange(startDateStr: string, endDateStr: string): Promise<Record<SensorType, SensorData[]>> {
  try {
    console.log(`Fetching readings from ${startDateStr} to ${endDateStr} (America/Los_Angeles timezone)`);
    
    // Initialize the result object with empty arrays for each sensor type
    const result: Record<SensorType, SensorData[]> = {
      aqi: [],
      temperature: [],
      humidity: [],
      pressure: [],
      tvoc: [],
      eco2: []
    };
    
    // Iterate through each day in the range using date strings
    let currentDateStr = startDateStr;
    while (currentDateStr <= endDateStr) {
      // Get readings for this specific date
      const dateReadings = await fetchReadingsForDate(currentDateStr);
      
      // Merge the readings into our result
      Object.keys(dateReadings).forEach((key) => {
        const sensorType = key as SensorType;
        result[sensorType] = [...result[sensorType], ...dateReadings[sensorType]];
      });
      
      // Move to next day
      currentDateStr = addDaysToDateString(currentDateStr, 1);
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
// Note: dateStr is in YYYY-MM-DD format and represents a date in America/Los_Angeles timezone
export async function fetchReadingsForDate(dateStr: string): Promise<Record<SensorType, SensorData[]>> {
  try {
    console.log(`Fetching readings for date: ${dateStr} (America/Los_Angeles timezone)`);
    
    // Get reference to the specific date document
    const dateDoc = doc(db, "crystal_cove", dateStr);
    
    // Get reference to the 'readings' subcollection
    const readingsCollectionRef = collection(dateDoc, "readings");
    
    // Query to get all documents from the subcollection, ordered by timestamp
    const q = query(readingsCollectionRef, orderBy("timestamp"));
    
    // Fetch the documents
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} readings for date ${dateStr}`);
    
    // Also fetch from the next day's document to get readings that might belong to this date
    const nextDateStr = addDaysToDateString(dateStr, 1);
    
    const nextDateDoc = doc(db, "crystal_cove", nextDateStr);
    const nextReadingsCollectionRef = collection(nextDateDoc, "readings");
    const nextQ = query(nextReadingsCollectionRef, orderBy("timestamp"));
    const nextQuerySnapshot = await getDocs(nextQ);
    
    console.log(`Found ${nextQuerySnapshot.size} readings in next day (${nextDateStr}) to check`);
    
    // Initialize the result object with empty arrays for each sensor type
    const result: Record<SensorType, SensorData[]> = {
      aqi: [],
      temperature: [],
      humidity: [],
      pressure: [],
      tvoc: [],
      eco2: []
    };
    
    // Helper function to process a reading
    const processReading = (reading: FirestoreReading) => {
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
    };
    
    // Process each reading document from the requested date
    querySnapshot.forEach((doc) => {
      const reading = doc.data() as FirestoreReading;
      processReading(reading);
    });
    
    // Process readings from the next day that belong to the requested date (in app timezone)
    nextQuerySnapshot.forEach((doc) => {
      const reading = doc.data() as FirestoreReading;
      
      // Convert timestamp to JavaScript Date
      const timestamp = typeof reading.timestamp === 'string' 
        ? new Date(reading.timestamp)
        : reading.timestamp.toDate();
      
      // Check if this reading's date matches the requested date in app timezone
      const readingDateStr = getDateStringInAppTimezone(timestamp);
      if (readingDateStr === dateStr) {
        console.log(`Found reading from ${nextDateStr} document that belongs to ${dateStr}`);
        processReading(reading);
      }
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
export async function fetchLatestStatusData(): Promise<StatusData> {
  try {
    // Get today's date in YYYY-MM-DD format in app timezone
    const today = getTodayInAppTimezone();
    
    // Try to get data from today first
    let dateDoc = doc(db, "crystal_cove", today);
    let readingsCollectionRef = collection(dateDoc, "readings");
    let q = query(readingsCollectionRef, orderBy("timestamp", "desc"), limit(1));
    let querySnapshot = await getDocs(q);
    
    // If no data for today, try the last 7 days
    if (querySnapshot.empty) {
      console.log("No status data found for today, searching recent days...");
      
      let currentDateStr = today;
      for (let i = 1; i <= 7; i++) {
        currentDateStr = addDaysToDateString(currentDateStr, -1);
        
        dateDoc = doc(db, "crystal_cove", currentDateStr);
        readingsCollectionRef = collection(dateDoc, "readings");
        q = query(readingsCollectionRef, orderBy("timestamp", "desc"), limit(1));
        querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`Found status data from ${currentDateStr}`);
          break;
        }
      }
    }
    
    if (querySnapshot.empty) {
      console.log("No status data found in the last 7 days, using default 92%");
      // Return default values with 92% as default soc_percent
      return {
        soc_percent: 92,
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
    
    const soc_percent = reading.soc_percent || reading.battery_percent || 92;
    console.log(`Using soc_percent: ${soc_percent} from database`);
    
    return {
      soc_percent,
      solar_watts: reading.solar_watts || 0,
      awake_hhmm: reading.awake_hhmm || "0:00",
      timestamp
    };
  } catch (error) {
    console.error("Error fetching latest status data:", error);
    // Return default values with 92% as default soc_percent
    return {
      soc_percent: 92,
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
//Manual Changes