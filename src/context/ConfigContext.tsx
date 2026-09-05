import React, { createContext, useContext, useState, useEffect } from 'react';
import { RestaurantConfig } from '../types';
import { DEFAULT_CONFIG } from '../data/menuData';

interface ConfigContextType {
  config: RestaurantConfig;
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  resetConfig: () => void;
}

const CONFIG_STORAGE_KEY = 'cheneb_tacos_config_v1';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<RestaurantConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // localStorage error handled
    }
  }, [config]);

  const updateConfig = (newConfig: Partial<RestaurantConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
