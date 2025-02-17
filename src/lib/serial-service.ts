
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

export interface SensorReading {
  aqi: number;
  tvoc: number;
  eco2: number;
  pressure: number;
  humidity: number;
  temperature: number;
  timestamp: Date;
}

class SerialService {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private subscribers: Set<(data: SensorReading) => void> = new Set();

  async connect(portPath: string = '/dev/cu.usbserial-0001') {
    try {
      this.port = new SerialPort({
        path: portPath,
        baudRate: 115200,
      });

      this.parser = this.port.pipe(new ReadlineParser());

      this.parser.on('data', (line: string) => {
        const [aqi, tvoc, eco2, pressure, humidity, temperature] = line
          .trim()
          .split(',')
          .map(Number);

        const reading: SensorReading = {
          aqi,
          tvoc,
          eco2,
          pressure,
          humidity,
          temperature,
          timestamp: new Date(),
        };

        this.notifySubscribers(reading);
      });

      console.log('Connected to serial port:', portPath);
    } catch (error) {
      console.error('Failed to connect to serial port:', error);
      throw error;
    }
  }

  subscribe(callback: (data: SensorReading) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(reading: SensorReading) {
    this.subscribers.forEach((callback) => callback(reading));
  }

  async disconnect() {
    if (this.port) {
      await new Promise<void>((resolve) => {
        this.port?.close(() => resolve());
      });
      this.port = null;
      this.parser = null;
      this.subscribers.clear();
    }
  }
}

export const serialService = new SerialService();
