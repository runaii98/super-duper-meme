const API_BASE_URL = 'http://35.214.57.65:3001';

interface UserCredentials {
  userId: string;
  password: string;
}

interface ContainerResponse {
  status: 'running' | 'stopped' | 'loading' | 'starting' | 'stopping' | 'not_found' | 'booting';
  app_url?: string;
  message?: string;
}

interface ContainerStatus {
  userId: string;
  status: 'running' | 'stopped' | 'not_found' | 'starting' | 'booting';
  app_url?: string;
}

interface RegisterParams {
  userId: string;
  password: string;
}

export const api = {
  register: async (params: UserCredentials): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  spinContainer: async (credentials: UserCredentials): Promise<ContainerResponse> => {
    const response = await fetch(`${API_BASE_URL}/spin-container`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  stopContainer: async (credentials: UserCredentials): Promise<ContainerResponse> => {
    const response = await fetch(`${API_BASE_URL}/stop-container`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  monitorContainer: async (credentials: UserCredentials): Promise<ContainerResponse> => {
    const response = await fetch(`${API_BASE_URL}/monitor-container`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  async authenticate(credentials: UserCredentials): Promise<{ message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
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
}; 