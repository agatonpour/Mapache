
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
                    const reading = {
                        aqi: parseInt(values[0]) || 0, // Parse as integer to avoid rounding down
                        temperature: parseFloat(values[1]) || 0,
                        humidity: parseFloat(values[2]) || 0, // Don't divide by 10 anymore
                        pressure: parseFloat(values[3]) || 0,
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
