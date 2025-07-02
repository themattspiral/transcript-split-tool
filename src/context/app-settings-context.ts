import { createContext, useContext } from 'react';

import { AppSettings, PersistenceMethod } from 'data';

interface AppSettingsContextProps {
  appSettings: AppSettings | null;
  savePersistenceMethod: (persistenceMethod: PersistenceMethod, persistenceRememberMe?: boolean) => void;
}

export const AppSettingsContext = createContext<AppSettingsContextProps>({
  appSettings: null,
  savePersistenceMethod: () => {}
});

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error(`useAppSettings must be used within an AppSettingsProvider`);
  }
  return context;
};
