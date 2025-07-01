import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppSettingsContext } from './app-settings-context';
import { useProjectData } from './project-data-context';
import { AppSettings, AppSettingsDataVersion, PersistenceMethod } from '../shared/data';
import { usePersistence } from './persistence/persistence-context';

/* App Settings Provider 
  - Provides browser session continuity by storing information about the last project
    the user was working on in localStorage
  - Initiates reload of a session (last project and view settings) on app init
*/

const APP_SETTINGS_STORAGE_KEY = 'appSettings';

const loadFromLocalStorage = (): AppSettings | null => {
  let confirmedSettings: AppSettings | null = null;

  const settingsStr = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);

  if (settingsStr) {
    try {
      const parsedSettings: AppSettings = JSON.parse(settingsStr);

      // data checks
      if (parsedSettings.dataVersion !== AppSettingsDataVersion.v1
        || !parsedSettings.persistenceMethod
        || !Object.values(PersistenceMethod).includes(parsedSettings.persistenceMethod)
      ) {
        console.error('Bad value in parsed appSettings:', parsedSettings);
        return null;
      }

      confirmedSettings = {
        dataVersion: AppSettingsDataVersion.v1,
        persistenceMethod: parsedSettings.persistenceMethod,
        persistenceRememberMe: parsedSettings.persistenceRememberMe || false,
        lastProjectName: parsedSettings.lastProjectName || null
      };
    } catch (err) {
      console.error('Error parsing appSettings:', err);
    }
  }

  return confirmedSettings;
};

const saveToLocalStorage = (settings: AppSettings) => {
  if (settings) {
    localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }
};

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { projectName } = useProjectData();
  const { setPersistenceMethod } = usePersistence();

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  const savePersistenceMethod = useCallback((persistenceMethod: PersistenceMethod, persistenceRememberMe?: boolean) => {
    setAppSettings(s => {
      if (s) {
        return {
          ...s,
          persistenceMethod,
          persistenceRememberMe: persistenceRememberMe || false
        };
      } else {
        return {
          persistenceMethod,
          persistenceRememberMe: persistenceRememberMe || false,
          lastProjectName: null,
          dataVersion: AppSettingsDataVersion.v1
        };
      }
    });
  }, [setAppSettings]);

  // restore local settings on mount - this kicks off the rest of the app init process
  useEffect(() => {
    const settings = loadFromLocalStorage();

    if (settings) {
      setAppSettings(settings);
      setPersistenceMethod(
        settings.persistenceMethod,
        settings.persistenceRememberMe,
        settings.lastProjectName
      );
    }
  }, [setAppSettings, setPersistenceMethod]);

  // update app settings when they're changed
  useEffect(() => {
    // todo - clear it also when project flows exist
    if (projectName && projectName !== '') {
      setAppSettings(s => {
        if (!s) return s;

        const newSettings: AppSettings = {
          ...(s as AppSettings),
          lastProjectName: projectName
        };
        return newSettings;
      });
    }
  }, [setAppSettings, projectName]);

  // store app settings when they're updated
  useEffect(() => {
    if (appSettings) {
      saveToLocalStorage(appSettings);
    }
  }, [appSettings]);
  
  const value = useMemo(() => ({
    appSettings, savePersistenceMethod
  }), [
    appSettings, savePersistenceMethod
  ]);

  return (
    <AppSettingsContext.Provider value={value}>
      { children }
    </AppSettingsContext.Provider>
  );
};
