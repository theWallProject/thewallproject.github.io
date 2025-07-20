declare global {
  interface Window {
    ml?: (command: string, ...args: any[]) => void;
  }
}

export {};
