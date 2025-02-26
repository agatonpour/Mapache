
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

  async connect(portPath?: string) {
    try {
      // List available ports first
      const ports = await SerialPort.list();
      console.log('Available ports:', ports);

      // Try to find a USB serial port if no specific port is provided
      const targetPort = portPath || ports.find(p => 
        p.path.includes('usbserial') || 
        p.path.includes('tty.usbserial') || 
        p.path.includes('USB')
      )?.path;

      if (!targetPort) {
        throw new Error('No suitable USB serial port found');
      }

      console.log('Attempting to connect to port:', targetPort);

      this.port = new SerialPort({
        path: targetPort,
        baudRate: 115200,
      });

      this.parser = this.port.pipe(new ReadlineParser());

      this.parser.on('data', (line: string) => {
        try {
          console.log('Raw data received:', line);
          
          // Parse the data line, removing timestamp if present
          const dataStr = line.includes('->') ? line.split('->')[1].trim() : line.trim();
          const values = dataStr.split(',').map(val => parseFloat(val.trim()));

          if (values.length >= 6) {
            const reading: SensorReading = {
              aqi: values[0],
              tvoc: values[1],
              eco2: values[2],
              pressure: values[3],
              humidity: values[4],
              temperature: values[5],
              timestamp: new Date(),
            };
            
            console.log('Parsed reading:', reading);
            this.notifySubscribers(reading);
          }
        } catch (error) {
          console.error('Error parsing sensor data:', error);
        }
      });

      this.port.on('error', (error) => {
        console.error('Serial port error:', error);
      });

      console.log('Connected to serial port:', targetPort);
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
