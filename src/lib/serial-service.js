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
                const [aqi, tvoc, eco2, pressure, humidity, temperature] = line
                    .trim()
                    .split(',')
                    .map(Number);
                const reading = {
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
