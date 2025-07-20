declare global {
  interface Window {
    ml?: (command: string, ...args: unknown[]) => void;
  }
}

export {};
