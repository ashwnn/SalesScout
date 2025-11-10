import React, { createContext, useState, useEffect } from 'react';
import api from '@/utils/api';

interface AppConfig {
  demoMode: boolean;
  registrationEnabled: boolean;
}

interface AppConfigContextType {
  config: AppConfig;
  loading: boolean;
}

const AppConfigContext = createContext<AppConfigContextType>({
  config: {
    demoMode: false,
    registrationEnabled: true
  },
  loading: true
});

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>({
    demoMode: false,
    registrationEnabled: true
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/users/config');
        if (response.data && response.data.config) {
          setConfig(response.data.config);
        }
      } catch (error) {
        console.error('Error fetching app config:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, loading }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export default AppConfigContext;
