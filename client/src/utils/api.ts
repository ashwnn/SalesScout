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

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a simple connection check function
const checkConnection = async () => {
  try {
    const response = await axios.get(process.env.REACT_APP_API_URL || 'http://localhost:3311');
    return true;
  } catch (error) {
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