
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

  constructor() {}

  async connect(portPath: string = this.defaultPort, baudRate: number = this.defaultBaudRate): Promise<void> {
    try {
      if (this.port) {
        await this.disconnect();
      }

      this.port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        autoOpen: false
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      return new Promise((resolve, reject) => {
        if (!this.port) return reject(new Error('Serial port not initialized'));

        this.port.open((err) => {
          if (err) {
            console.error('Error opening serial port:', err.message);
            return reject(err);
          }

          console.log(`Connected to serial port: ${portPath} at ${baudRate} baud`);

          if (this.parser) {
            this.parser.on('data', (data: string) => {
              try {
                const reading = this.parseData(data);
                this.notifySubscribers(reading);
              } catch (error) {
                console.error('Error parsing data:', error);
              }
            });
          }

          if (this.port) {
            this.port.on('error', (err) => {
              console.error('Serial port error:', err);
            });
          }

          resolve();
        });
      });
    } catch (error) {
      console.error('Failed to connect to serial port:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
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

  private parseData(data: string): SensorReading {
    try {
      const jsonData = JSON.parse(data);
      return {
        temperature: parseFloat(jsonData.temperature) || 0,
        humidity: parseFloat(jsonData.humidity) || 0, 
        pressure: parseFloat(jsonData.pressure) || 0,
        tvoc: parseFloat(jsonData.tvoc) || 0,
        eco2: parseFloat(jsonData.eco2) || 0,
        aqi: parseFloat(jsonData.aqi) || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      throw error;
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
