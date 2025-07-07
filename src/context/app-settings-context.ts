import { createContext, useContext } from 'react';

import { AppSettings, PersistenceMethod } from 'data';

interface AppSettingsContextProps {
  appSettings: AppSettings | null;
  loadedAppSettings: () => Promise<AppSettings | null>;
  hasSavedAppSettings: () => boolean;
  savePersistenceMethod: (persistenceMethod: PersistenceMethod, persistenceRememberMe?: boolean) => void;
}

export const AppSettingsContext = createContext<AppSettingsContextProps>({
  appSettings: null,
  loadedAppSettings: () => Promise.reject(0),
  hasSavedAppSettings: () => false,
  savePersistenceMethod: () => {}
});

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error(`useAppSettings must be used within an AppSettingsProvider`);
  }
  return context;
};
