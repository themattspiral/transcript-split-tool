import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppSettings, AppSettingsDataVersion, PersistenceEvent, PersistenceMethod } from 'data';
import { AppSettingsContext } from './app-settings-context';
import { useProjectData } from './project-data-context';
import { usePersistence } from './persistence/persistence-context';

/* App Settings Provider 
  - Provides browser session continuity by storing information about the last project
    the user was working on in localStorage
  - Initiates reload of a session (last project and view settings) on app init
*/

const APP_SETTINGS_STORAGE_KEY = 'appSettings';

const parseBoolean = (setting: any): boolean => {
  if (setting === undefined || setting === null) {
    return false;
  } else {
    return setting === true;
  }
};

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
        persistenceRememberMe: parseBoolean(parsedSettings.persistenceRememberMe),
        persistenceFolderName: parsedSettings.persistenceFolderName || null,
        persistenceHasAuthorized: parseBoolean(parsedSettings.persistenceHasAuthorized),
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
  const { setPersistenceMethod, initializePersistence, isPathOauthCallback, lastPersistenceEvent } = usePersistence();

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const settingsLoadedRef = useRef<boolean>(false);

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
          persistenceHasAuthorized: false,
          lastProjectName: null,
          dataVersion: AppSettingsDataVersion.v1
        };
      }
    });
  }, [setAppSettings]);

  // restore local settings on mount - this kicks off the rest of the app init process
  useEffect(() => {
    if (!settingsLoadedRef.current) {
      settingsLoadedRef.current = true;
      console.log('settings: not yet loaded');

      const settings = loadFromLocalStorage();
      if (settings) {
        console.log('settings: retrieved from localStorage');
        setAppSettings(settings);

        console.log('settings: setting persistence method');

        setPersistenceMethod(settings.persistenceMethod, settings.persistenceFolderName);

        if (!isPathOauthCallback) {
          console.log('settings: initializing persistence (no await)');
          initializePersistence();
          // we don't need to wait for the async setPersistenceMethod function to complete - just fire and forget
          // (persistence init errors are caught and handled with error statuses in that context)
        } else {
          console.log('settings: skipping persistence init to allow auth completion and init from settings page');
        }
      } else {
        console.log('settings: no app settings defined yet (initial use)');
      }

      console.log('settings: load complete');
    } else {
      // console.log('settings: already loaded, not loading again');
    }
  }, [isPathOauthCallback, initializePersistence, setAppSettings, setPersistenceMethod]);

  // project name
  // todo - make this an explicit call from outside instead
  useEffect(() => {
    // todo - clear it also when project flows exist
    if (projectName && projectName !== '') {
      setAppSettings(s => {
        if (!s) return s;

        if (s.lastProjectName === projectName) {
          return s;
        }

        console.log('settings: saving new local app settings for new lastProjectName');

        const newSettings: AppSettings = {
          ...(s as AppSettings),
          lastProjectName: projectName
        };
        return newSettings;
      });
    }
  }, [setAppSettings, projectName]);

  // persistenceHasAuthorized
  // todo - make this an explicit call from outside instead
  useEffect(() => {
    if (lastPersistenceEvent === PersistenceEvent.Authorized) {
      setAppSettings(s => {
        if (!s) return s;

        if (s.persistenceHasAuthorized) {
          return s;
        }

        console.log('settings: saving persistenceHasAuthorized');

        const newSettings: AppSettings = {
          ...(s as AppSettings),
          persistenceHasAuthorized: true
        };
        return newSettings;
      });
    }
  }, [setAppSettings, lastPersistenceEvent]);

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
