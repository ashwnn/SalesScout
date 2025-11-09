import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || 'http://localhost:3311'}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // Set a timeout to catch server connection issues
  withCredentials: false
});

// Add request interceptor to log requests (helpful for debugging)
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Cannot connect to backend server. Make sure the server is running on port 3311');
    } else if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Add a simple connection check function
const checkConnection = async () => {
  try {
    const response = await axios.get(process.env.REACT_APP_API_URL || 'http://localhost:3311');
    console.log('Connected to API server:', response.data);
    return true;
  } catch (error) {
    console.error('API server connection failed:', error);
    return false;
  }
};

const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Export both the instance and helper functions
export default {
  ...api,
  setAuthToken,
  checkConnection,
  get: api.get,
  post: api.post,
  put: api.put,
  delete: api.delete,
  patch: api.patch
};