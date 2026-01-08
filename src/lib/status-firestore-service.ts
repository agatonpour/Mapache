import { 
  collection, 
  getDocs,
  doc,
  Timestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { SensorData, StatusSensorType } from "./mock-data";
import { FirestoreReading } from "./firestore-service";
import {
  getDateStringInAppTimezone,
  addDaysToDateString
} from "./timezone-utils";

// Function to fetch status readings for a specific date range
// Note: startDateStr and endDateStr are in YYYY-MM-DD format and represent dates in America/Los_Angeles timezone
export async function fetchStatusReadingsForDateRange(startDateStr: string, endDateStr: string): Promise<Record<StatusSensorType, SensorData[]>> {
  try {
    console.log(`Fetching status readings from ${startDateStr} to ${endDateStr} (America/Los_Angeles timezone)`);
    
    // Initialize the result object with empty arrays for each status sensor type
    const result: Record<StatusSensorType, SensorData[]> = {
      soc_percent: [],
      battery_voltage_v: [],
      solar_power_w: [],
      solar_voltage_v: [],
      solar_current_ma: []
    };
    
    // Iterate through each day in the range using date strings
    let currentDateStr = startDateStr;
    while (currentDateStr <= endDateStr) {
      // Get readings for this specific date
      const dateReadings = await fetchStatusReadingsForDate(currentDateStr);
      
      // Merge the readings into our result
      Object.keys(dateReadings).forEach((key) => {
        const sensorType = key as StatusSensorType;
        result[sensorType] = [...result[sensorType], ...dateReadings[sensorType]];
      });
      
      // Move to next day
      currentDateStr = addDaysToDateString(currentDateStr, 1);
    }
    
    // Sort all readings by timestamp
    Object.keys(result).forEach((key) => {
      const sensorType = key as StatusSensorType;
      result[sensorType].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });
    
    return result;
  } catch (error) {
    console.error(`Error fetching status readings for date range ${startDateStr} to ${endDateStr}:`, error);
    // Return empty data on error
    return {
      soc_percent: [],
      battery_voltage_v: [],
      solar_power_w: [],
      solar_voltage_v: [],
      solar_current_ma: []
    };
  }
}

// Function to fetch status readings from a specific date
// Note: dateStr is in YYYY-MM-DD format and represents a date in America/Los_Angeles timezone
export async function fetchStatusReadingsForDate(dateStr: string): Promise<Record<StatusSensorType, SensorData[]>> {
  try {
    console.log(`Fetching status readings for date: ${dateStr} (America/Los_Angeles timezone)`);
    
    // Get reference to the specific date document
    const dateDoc = doc(db, "crystal_cove", dateStr);
    
    // Get reference to the 'readings' subcollection
    const readingsCollectionRef = collection(dateDoc, "readings");
    
    // Query to get all documents from the subcollection, ordered by timestamp
    const q = query(readingsCollectionRef, orderBy("timestamp"));
    
    // Fetch the documents
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} status readings for date ${dateStr}`);
    
    // Also fetch from the next day's document to get readings that might belong to this date
    const nextDateStr = addDaysToDateString(dateStr, 1);
    
    const nextDateDoc = doc(db, "crystal_cove", nextDateStr);
    const nextReadingsCollectionRef = collection(nextDateDoc, "readings");
    const nextQ = query(nextReadingsCollectionRef, orderBy("timestamp"));
    const nextQuerySnapshot = await getDocs(nextQ);
    
    console.log(`Found ${nextQuerySnapshot.size} readings in next day (${nextDateStr}) to check`);
    
    // Initialize the result object with empty arrays for each status sensor type
    const result: Record<StatusSensorType, SensorData[]> = {
      soc_percent: [],
      battery_voltage_v: [],
      solar_power_w: [],
      solar_voltage_v: [],
      solar_current_ma: []
    };
    
    // Helper function to process a reading
    const processReading = (reading: FirestoreReading) => {
      // Convert timestamp to JavaScript Date
      const timestamp = typeof reading.timestamp === 'string' 
        ? new Date(reading.timestamp)
        : reading.timestamp.toDate();
      
      // Add data points for each status sensor type, with fallback to 0 if data doesn't exist
      result.soc_percent.push({ 
        type: 'soc_percent', 
        value: reading.soc_percent || 0, 
        timestamp 
      });
      
      result.battery_voltage_v.push({ 
        type: 'battery_voltage_v', 
        value: reading.battery_voltage_v || 0, 
        timestamp 
      });
      
      result.solar_power_w.push({ 
        type: 'solar_power_w', 
        value: reading.solar_power_w || 0, 
        timestamp 
      });
      
      result.solar_voltage_v.push({ 
        type: 'solar_voltage_v', 
        value: reading.solar_voltage_v || 0, 
        timestamp 
      });
      
      // Try solar_current_a first (Amps), then fall back to solar_current_ma
      const currentValue = (reading as any).solar_current_a ?? reading.solar_current_ma ?? 0;
      
      result.solar_current_ma.push({ 
        type: 'solar_current_ma', 
        value: currentValue, 
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
        console.log(`Found status reading from ${nextDateStr} document that belongs to ${dateStr}`);
        processReading(reading);
      }
    });
    
    return result;
  } catch (error) {
    console.error(`Error fetching status readings for date ${dateStr}:`, error);
    // Return empty data on error
    return {
      soc_percent: [],
      battery_voltage_v: [],
      solar_power_w: [],
      solar_voltage_v: [],
      solar_current_ma: []
    };
  }
}