// Type declarations to suppress serialport type errors
// These packages are only used in the separate Node.js backend (src/server/)
// and should not be part of the frontend bundle

declare module 'serialport' {
  export class SerialPort {
    constructor(options: any);
    open(callback: (err: Error | null) => void): void;
    close(callback: (err: Error | null) => void): void;
    pipe(parser: any): any;
    on(event: string, callback: (...args: any[]) => void): void;
    isOpen: boolean;
    static list(): Promise<Array<{ path: string }>>;
  }
}

declare module '@serialport/parser-readline' {
  export class ReadlineParser {
    constructor(options: any);
    on(event: string, callback: (data: any) => void): void;
  }
}

declare module '@serialport/bindings-interface' {
  export interface BindingPortInterface {}
  export interface OpenOptionsFromBinding {}
}

declare module '@serialport/bindings-cpp' {
  export interface BindingPortInterface {}
  export interface OpenOptionsFromBinding {}
}

declare module '@serialport/binding-mock' {
  export class MockBinding {}
}
