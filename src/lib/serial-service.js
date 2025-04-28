
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
class SerialService {
    port = null;
    parser = null;
    subscribers = new Set();
    async connect(portPath = '/dev/cu.usbserial-0001') {
        try {
            this.port = new SerialPort({
                path: portPath,
                baudRate: 115200,
            });
            this.parser = this.port.pipe(new ReadlineParser());
            this.parser.on('data', (line) => {
                // Parse CSV data
                const values = line.trim().split(',').map(val => val.trim());
                
                if (values.length >= 6) {
                    // Parse AQI and ensure it's not rounded down to 0 if it should be 1
                    const aqi = parseInt(values[0]) || 0;
                    
                    const reading = {
                        aqi: aqi === 0 ? 0 : Math.max(1, aqi), // Prevent rounding down AQI
                        temperature: parseFloat(values[1]) || 0,
                        humidity: parseFloat(values[2]) || 0, // We'll multiply by 10 in the UI
                        pressure: parseFloat(values[3]) || 0, // We'll divide by 10 in the UI
                        tvoc: parseFloat(values[4]) || 0,
                        eco2: parseFloat(values[5]) || 0,
                        timestamp: new Date(),
                    };
                    this.notifySubscribers(reading);
                }
            });
            console.log('Connected to serial port:', portPath);
        }
        catch (error) {
            console.error('Failed to connect to serial port:', error);
            throw error;
        }
    }
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    notifySubscribers(reading) {
        this.subscribers.forEach((callback) => callback(reading));
    }
    async disconnect() {
        if (this.port) {
            await new Promise((resolve) => {
                this.port?.close(() => resolve());
            });
            this.port = null;
            this.parser = null;
            this.subscribers.clear();
        }
    }
}
export const serialService = new SerialService();
