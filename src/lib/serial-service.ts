
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

export interface SensorReading {
  temperature: number;
  humidity: number;
  pressure: number;
  tvoc: number;
  eco2: number;
  aqi: number;
  timestamp: number;
}

type Subscriber = (data: SensorReading) => void;

class SerialService {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private subscribers: Subscriber[] = [];
  private defaultPort: string = '/dev/tty.usbmodem1101';
  private defaultBaudRate: number = 115200;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor() {}

  async connect(portPath: string = this.defaultPort, baudRate: number = this.defaultBaudRate): Promise<void> {
    // Don't attempt to connect if already connecting
    if (this.isConnecting) {
      throw new Error('Already attempting to connect');
    }
    
    try {
      this.isConnecting = true;
      this.reconnectAttempts = 0;
      
      // Make sure we're disconnected first
      await this.disconnect();
      
      this.port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        autoOpen: false
      });

      return new Promise((resolve, reject) => {
        if (!this.port) {
          this.isConnecting = false;
          return reject(new Error('Serial port not initialized'));
        }

        this.port.open((err) => {
          this.isConnecting = false;
          
          if (err) {
            console.error('Error opening serial port:', err.message);
            this.port = null;
            return reject(err);
          }

          console.log(`Connected to serial port: ${portPath} at ${baudRate} baud`);

          if (this.port) {
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
            
            this.parser.on('data', (data: string) => {
              try {
                const reading = this.parseCSVData(data.trim());
                if (reading) {
                  this.notifySubscribers(reading);
                }
              } catch (error) {
                console.error('Error parsing data:', error);
              }
            });
            
            if (this.port) {
              this.port.on('error', (err) => {
                console.error('Serial port error:', err);
              });
              
              this.port.on('close', () => {
                console.log('Serial port was closed');
                this.port = null;
                this.parser = null;
              });
            }
          }

          resolve();
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect to serial port:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.port && this.port.isOpen) {
        this.port.close((err) => {
          if (err) {
            console.error('Error closing port:', err);
          } else {
            console.log('Serial port closed successfully');
          }
          this.port = null;
          this.parser = null;
          resolve();
        });
      } else {
        this.port = null;
        this.parser = null;
        resolve();
      }
    });
  }

  private parseCSVData(data: string): SensorReading | null {
    try {
      // Check if the data string has content
      if (!data || data.length === 0) {
        return null;
      }

      // Split by comma and trim each value
      const values = data.split(',').map(val => val.trim());
      
      // Ensure we have all the values we need (at least 6 values)
      if (values.length < 6) {
        console.warn('Incomplete data received:', data);
        return null;
      }

      // Format: index, temp, humidity, pressure, tvoc, eco2, aqi (optional)
      // e.g.: "1, 24, 401, 100917, 37, 27.10"
      return {
        temperature: parseFloat(values[1]) || 0,
        humidity: parseFloat(values[2]) || 0,
        pressure: parseFloat(values[3]) || 0,
        tvoc: parseFloat(values[4]) || 0,
        eco2: parseFloat(values[5]) || 0,
        aqi: values.length > 6 ? parseFloat(values[6]) || 0 : 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      return null;
    }
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers(data: SensorReading) {
    this.subscribers.forEach((callback) => callback(data));
  }
}

export const serialService = new SerialService();
