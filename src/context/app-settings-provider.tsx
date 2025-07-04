import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppSettings, AppSettingsDataVersion, PersistenceMethod } from 'data';
import { AppSettingsContext } from './app-settings-context';
import { useProjectData } from './project-data-context';
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
        persistenceFolderName: parsedSettings.persistenceFolderName || null,
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
  const { setPersistenceMethod, initializePersistence, isPathOauthCallback } = usePersistence();

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  const savePersistenceMethod = useCallback((
    persistenceMethod: PersistenceMethod,
    persistenceRememberMe?: boolean,
    persistenceFolderName?: string
  ) => {
    setAppSettings(s => {
      if (s) {
        return {
          ...s,
          persistenceMethod,
          persistenceRememberMe: persistenceRememberMe || false,
          persistenceFolderName: persistenceFolderName || null
        };
      } else {
        return {
          persistenceMethod,
          persistenceRememberMe: persistenceRememberMe || false,
          persistenceFolderName: persistenceFolderName || null,
          lastProjectName: null,
          dataVersion: AppSettingsDataVersion.v1
        };
      }
    });
  }, [setAppSettings]);

  // restore local settings on mount - this kicks off the rest of the app init process
  useEffect(() => {
    if (isInitializedRef.current === false) {
      console.log('settings: not yet loaded');
      isInitializedRef.current = true;

      const settings = loadFromLocalStorage();
      if (settings) {
        console.log('settings: retrieved from localStorage');
        setAppSettings(settings);

        console.log('settings: setting persistence method');

        setPersistenceMethod(settings.persistenceMethod, settings.persistenceFolderName);

        if (!isPathOauthCallback) {
          console.log('settings: initializing persistence (kickoff)');
          initializePersistence();
          // we don't need to wait for the async setPersistenceMethod function to complete - just fire and forget
          // (persistence init errors are caught and handled with error statuses in that context)
        } else {
          console.log('settings: skipping persistence init to allow auth completion from settings page');
        }
      } else {
        console.log('settings: no app settings defined yet (initial use)');
      }

      console.log('settings: load complete');
    } else {
      console.log('settings: already loaded, not loading again');
    }
  }, [isPathOauthCallback, initializePersistence, setAppSettings, setPersistenceMethod]);

  // update app settings when they're changed
  // todo - make this an explicit call from outside instead
  useEffect(() => {
    // todo - clear it also when project flows exist
    if (projectName && projectName !== '') {
      console.log('saving new local app settings for new project name');
      setAppSettings(s => {
        if (!s) return s;

        if (s.lastProjectName === projectName) {
          return s;
        }

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
