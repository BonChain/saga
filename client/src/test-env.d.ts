// Test environment declarations for Vite environment variables
declare global {
  const import: {
    meta: {
      env: {
        DEV: boolean;
        MODE: string;
        VITE_SERVER_URL?: string;
        VITE_API_URL?: string;
        [key: string]: any;
      };
    };
  };
}

export {};