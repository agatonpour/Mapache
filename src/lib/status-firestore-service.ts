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

// Function to fetch status readings for a specific date range
export async function fetchStatusReadingsForDateRange(startDateStr: string, endDateStr: string): Promise<Record<StatusSensorType, SensorData[]>> {
  try {
    console.log(`Fetching status readings from ${startDateStr} to ${endDateStr}`);
    
    // Initialize the result object with empty arrays for each status sensor type
    const result: Record<StatusSensorType, SensorData[]> = {
      soc_percent: [],
      battery_voltage_v: [],
      solar_power_w: [],
      solar_voltage_v: [],
      solar_current_ma: []
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
      const dateReadings = await fetchStatusReadingsForDate(dateStr);
      
      // Merge the readings into our result
      Object.keys(dateReadings).forEach((key) => {
        const sensorType = key as StatusSensorType;
        result[sensorType] = [...result[sensorType], ...dateReadings[sensorType]];
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
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
export async function fetchStatusReadingsForDate(dateStr: string): Promise<Record<StatusSensorType, SensorData[]>> {
  try {
    console.log(`Fetching status readings for date: ${dateStr}`);
    
    // Get reference to the specific date document
    const dateDoc = doc(db, "crystal_cove", dateStr);
    
    // Get reference to the 'readings' subcollection
    const readingsCollectionRef = collection(dateDoc, "readings");
    
    // Query to get all documents from the subcollection, ordered by timestamp
    const q = query(readingsCollectionRef, orderBy("timestamp"));
    
    // Fetch the documents
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} status readings for date ${dateStr}`);
    
    // Initialize the result object with empty arrays for each status sensor type
    const result: Record<StatusSensorType, SensorData[]> = {
      soc_percent: [],
      battery_voltage_v: [],
      solar_power_w: [],
      solar_voltage_v: [],
      solar_current_ma: []
    };
    
    // Process each reading document
    querySnapshot.forEach((doc) => {
      const reading = doc.data() as FirestoreReading;
      
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
      
      result.solar_current_ma.push({ 
        type: 'solar_current_ma', 
        value: reading.solar_current_ma || 0, 
        timestamp 
      });
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