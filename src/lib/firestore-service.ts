
import { 
  collection, 
  query, 
  getDocs,
  getDoc,
  doc,
  Timestamp,
  orderBy,
  where,
  DocumentData
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

// Function to generate an array of date strings between two dates
function getDatesBetween(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  // Format the date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Function to fetch readings from a specific date
async function fetchReadingsForDate(dateStr: string, startTime: Date, endTime: Date): Promise<FirestoreReading[]> {
  try {
    const dateDoc = doc(db, "raccoonbot_data", dateStr);
    const dateDocSnapshot = await getDoc(dateDoc);
    
    if (!dateDocSnapshot.exists()) {
      console.log(`No data found for date: ${dateStr}`);
      return [];
    }
    
    const readingsRef = collection(dateDoc, "readings");
    
    // Convert JavaScript Date objects to Firestore Timestamp objects
    const q = query(
      readingsRef,
      where("timestamp", ">=", startTime.toISOString()),
      where("timestamp", "<=", endTime.toISOString()),
      orderBy("timestamp")
    );
    
    const querySnapshot = await getDocs(q);
    const readings: FirestoreReading[] = [];
    
    querySnapshot.forEach((doc) => {
      readings.push(doc.data() as FirestoreReading);
    });
    
    return readings;
  } catch (error) {
    console.error(`Error fetching readings for date ${dateStr}:`, error);
    return [];
  }
}

// Function to fetch readings for a time range
export async function fetchReadingsForTimeRange(startTime: Date, endTime: Date): Promise<Record<SensorType, SensorData[]>> {
  const dateStrings = getDatesBetween(startTime, endTime);
  const allReadings: FirestoreReading[] = [];
  
  // Fetch readings from all relevant date documents
  for (const dateStr of dateStrings) {
    const readings = await fetchReadingsForDate(dateStr, startTime, endTime);
    allReadings.push(...readings);
  }
  
  // Sort all readings by timestamp
  allReadings.sort((a, b) => {
    const timeA = typeof a.timestamp === 'string' 
      ? new Date(a.timestamp).getTime() 
      : a.timestamp.toDate().getTime();
    const timeB = typeof b.timestamp === 'string'
      ? new Date(b.timestamp).getTime()
      : b.timestamp.toDate().getTime();
    return timeA - timeB;
  });
  
  // Convert to the format expected by the UI
  const result: Record<SensorType, SensorData[]> = {
    aqi: [],
    temperature: [],
    humidity: [],
    pressure: [],
    tvoc: [],
    eco2: []
  };
  
  allReadings.forEach(reading => {
    const timestamp = typeof reading.timestamp === 'string' 
      ? new Date(reading.timestamp)
      : reading.timestamp.toDate();
    
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
      value: reading.humidity_percent / 10, // Dividing by 10 because we'll multiply by 10 in SensorCard
      timestamp 
    });
    
    result.pressure.push({ 
      type: 'pressure', 
      value: reading.pressure_pa * 10, // Multiplying by 10 because we'll divide by 10 in SensorCard
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
}
