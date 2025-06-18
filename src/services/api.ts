const BASE_URL = 'http://35.214.57.65';
const DEFAULT_PORT = '3001';

// Helper function to get the API URL with the correct port
const getApiUrl = (endpoint: string): string => {
  const serverPort = localStorage.getItem('server_port') || DEFAULT_PORT;
  return `${BASE_URL}:${serverPort}${endpoint}`;
};

// Helper function to get stored credentials
const getStoredCredentials = (): UserCredentials | null => {
  const userId = localStorage.getItem('userId');
  const password = localStorage.getItem('password');
  if (!userId || !password) return null;
  return { userId, password };
};

export type ContainerStatusType = 'running' | 'stopped' | 'loading' | 'error';

export interface UserCredentials {
  userId: string;
  password: string;
  instanceName?: string;
  gpu?: string;
  storage?: string;
  template?: string;
}

export interface GPU {
  name: string;
  type: string;
  memory: number;
  usage: number;
  temperature?: number;
}

export interface Storage {
  type: string;
  size: number;
  used: number;
  readSpeed?: number;
  writeSpeed?: number;
}

export interface ContainerResponse {
  id: string;
  name: string;
  status: ContainerStatusType;
  template?: string;
  gpu?: GPU;
  storage?: Storage;
  app_url?: string;
  message?: string;
  uptime?: string;
  memory?: {
    total: number;
    used: number;
    utilization: number;
  };
}

interface RegisterResponse {
  message: string;
  server_port?: string;
  error?: string;
}

export const api = {
  register: async (credentials: UserCredentials): Promise<RegisterResponse> => {
    try {
      const response = await fetch(`${BASE_URL}:${DEFAULT_PORT}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify(credentials),
    });
      
      const data: RegisterResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Store credentials and server port if registration is successful
      if (data.server_port) {
        localStorage.setItem('server_port', data.server_port);
        localStorage.setItem('userId', credentials.userId);
        localStorage.setItem('password', credentials.password);
      }

      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  spinContainer: async (credentials: UserCredentials): Promise<ContainerResponse> => {
    const stored = getStoredCredentials();
    if (!stored) throw new Error('No stored credentials found');
    
    const response = await fetch(getApiUrl('/spin-container'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...stored,
        ...credentials
      }),
    });
    return response.json();
  },

  stopContainer: async (credentials: UserCredentials): Promise<ContainerResponse> => {
    const stored = getStoredCredentials();
    if (!stored) throw new Error('No stored credentials found');

    const response = await fetch(getApiUrl('/stop-container'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...stored,
        ...credentials
      }),
    });
    return response.json();
  },

  monitorContainer: async (credentials: UserCredentials): Promise<ContainerResponse> => {
    const stored = getStoredCredentials();
    if (!stored) throw new Error('No stored credentials found');

    const response = await fetch(getApiUrl('/monitor-container'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...stored,
        ...credentials
      }),
    });
    return response.json();
  },

  authenticate: async (credentials: UserCredentials): Promise<{ message?: string; error?: string }> => {
    try {
      const stored = getStoredCredentials();
      const response = await fetch(getApiUrl('/authenticate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stored || credentials),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.message || 'Authentication failed' };
      }

      return { message: data.message };
    } catch (error) {
      return { error: 'Failed to authenticate' };
    }
  },

  logout: () => {
    localStorage.removeItem('server_port');
    localStorage.removeItem('userId');
    localStorage.removeItem('password');
  }
}; 