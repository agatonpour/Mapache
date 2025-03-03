
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import EventEmitter from 'events';

export interface SensorReading {
  temperature: number;
  humidity: number;
  pressure: number;
  tvoc: number;
  eco2: number;
  aqi: number;
  timestamp: number;
}

class SerialService extends EventEmitter {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private isConnected: boolean = false;

  constructor() {
    super();
  }

  async connect(portPath: string, baudRate: number): Promise<void> {
    // Don't attempt to connect if already connecting or connected
    if (this.isConnecting) {
      throw new Error('Already attempting to connect');
    }
    
    if (this.isConnected && this.port?.isOpen) {
      console.log(`Already connected to ${portPath}`);
      return;
    }
    
    try {
      this.isConnecting = true;
      this.reconnectAttempts = 0;
      
      // Make sure we're disconnected first
      await this.disconnect();
      
      console.log(`Attempting to connect to: ${portPath} at ${baudRate} baud`);
      
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
            this.isConnected = false;
            return reject(err);
          }

          console.log(`Connected to serial port: ${portPath} at ${baudRate} baud`);
          this.isConnected = true;

          // Setup parser for incoming data - FIX: Check for null port
          if (this.port) {
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
            
            // Listen for data continuously
            this.parser.on('data', (data: string) => {
              try {
                console.log('Raw data received:', data);
                const reading = this.parseCSVData(data.trim());
                if (reading) {
                  this.emit('sensorData', reading);
                }
              } catch (error) {
                console.error('Error parsing data:', error);
              }
            });
            
            // Handle port errors - FIX: Check for null port
            this.port.on('error', (err) => {
              console.error('Serial port error:', err);
              this.emit('error', err.message);
            });
            
            // Handle port closure - FIX: Check for null port
            this.port.on('close', () => {
              console.log('Serial port was closed');
              this.isConnected = false;
              this.port = null;
              this.parser = null;
              this.emit('disconnected');
            });
          }

          resolve();
        });
      });
    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;
      console.error('Failed to connect to serial port:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.isConnected && this.port && this.port.isOpen) {
        this.port.close((err) => {
          if (err) {
            console.error('Error closing port:', err);
          } else {
            console.log('Serial port closed successfully');
          }
          this.isConnected = false;
          this.port = null;
          this.parser = null;
          resolve();
        });
      } else {
        this.isConnected = false;
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
        humidity: parseFloat(values[2]) / 10 || 0, // Divide by 10 to get the correct humidity value
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

  isPortConnected(): boolean {
    return this.isConnected && this.port !== null && this.port.isOpen;
  }
}

export const serialService = new SerialService();
