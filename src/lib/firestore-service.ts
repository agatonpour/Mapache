
import { 
  collection, 
  getDocs,
  doc,
  Timestamp,
  orderBy,
  query
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
        value: reading.pressure_pa * 10, // Multiplying by 10 as it will be divided in SensorCard
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
