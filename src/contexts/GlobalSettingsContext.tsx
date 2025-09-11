import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalSettingsContextType {
  showIds: boolean;
  setShowIds: (show: boolean) => void;
  isAdminTimeLocked: boolean;
  setIsAdminTimeLocked: (locked: boolean) => void;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

interface GlobalSettingsProviderProps {
  children: ReactNode;
}

export const GlobalSettingsProvider: React.FC<GlobalSettingsProviderProps> = ({ children }) => {
  const [showIds, setShowIds] = useState(false);
  const [isAdminTimeLocked, setIsAdminTimeLocked] = useState(false);

  const value: GlobalSettingsContextType = {
    showIds,
    setShowIds,
    isAdminTimeLocked,
    setIsAdminTimeLocked,
  };

  return (
    <GlobalSettingsContext.Provider value={value}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
};