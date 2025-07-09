import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { AppSettings, AppSettingsDataVersion, PersistenceEvent, PersistenceMethod, PersistenceResult } from 'data';
import { AppSettingsContext } from './app-settings-context';
import { usePersistence } from './persistence/persistence-context';
import { useViewState } from './view-state-context';

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
        persistenceHasAuthorized: parseBoolean(parsedSettings.persistenceHasAuthorized)
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
  const {
    setPersistenceMethod, completeAuthorizeExternal, initializePersistence,
    isPathOauthCallback, lastPersistenceEvent
  } = usePersistence();

  const { busyModal, infoModal, hideModals } = useViewState();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hasSavedAppSettings = useCallback(() => !!loadFromLocalStorage(), []);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const loadedFlagRef = useRef<boolean>(false);
  const loadingPromiseRef = useRef<{
    promise: Promise<AppSettings | null> | null,
    resolve: ((settings: AppSettings | null) => void) | null;
    reject: (() => void) | null;
  }>({
    promise: null,
    resolve: null,
    reject: null
  });

  const createLoadingPromise = (): Promise<AppSettings | null> => {
    const promise = new Promise<AppSettings | null>((resolve, reject) => {
      loadingPromiseRef.current.resolve = resolve;
      loadingPromiseRef.current.reject = reject;
    });
    loadingPromiseRef.current.promise = promise;
    return promise;
  };

  const completeOauthAndInitialize = useCallback(async (rememberMe: boolean): Promise<void> => {
    busyModal(`Finishing Google Drive Setup...`);
    console.log('settings: completing external authorization');

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !state) {
      if (searchParams.get('error') === 'access_denied') {
        infoModal(`Error completing authorization - access was denied.`);
        console.error('settings: access_denied from oauth provider (user cancelled)');
      } else {
        infoModal(`Error completing authorization. Incorrect data received from your provider.`);
        console.error('settings: code or state missing in query params:', searchParams.toString());
      }

      console.log('settings: navigate to /settings (with replace:true for url cleanup)');
      navigate('/settings', { replace: true });
      return;
    }

    try {
      await completeAuthorizeExternal(code, state, rememberMe);
    } catch (authResult) {
      console.error('settings: error completing external auth:', authResult);
      infoModal(`Error completing authorization. Status: ${(authResult as PersistenceResult).persistenceStatus}`);

      console.log('settings: navigate to /settings (with replace:true for url cleanup)');
      navigate('/settings', { replace: true });
      return;
    }

    console.log('settings: authorized!');

    console.log('settings: initial url cleanup (replace state without router navigation)');
    window.history.replaceState({}, '', '/settings');

    console.log('settings: initializing persistence');
    try {
      await initializePersistence();
    } catch (initResult) {
      console.error('settings: error completing persistence init:', initResult);
      infoModal(`Error completing init. Status: ${(initResult as PersistenceResult).persistenceStatus}`);

      // align react router state with the history we changed above
      console.log('settings: navigate to /settings (align router with url cleanup)');
      navigate('/settings', { replace: true });
      return;
    }

    console.log('settings: persistence initialized!');
    hideModals();

    // align react router state with the history we changed above
    console.log('settings: navigate to /settings (align router with url cleanup)');
    navigate('/settings', { replace: true });
  }, [searchParams, busyModal, infoModal, hideModals, completeAuthorizeExternal, initializePersistence, navigate]);

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
          persistenceFolderName: persistenceFolderName || null,
          persistenceHasAuthorized: false
        };
      } else {
        return {
          persistenceMethod,
          persistenceRememberMe: persistenceRememberMe || false,
          persistenceFolderName: persistenceFolderName || null,
          persistenceHasAuthorized: false,
          dataVersion: AppSettingsDataVersion.v1
        };
      }
    });
  }, [setAppSettings]);

  const saveSetting = useCallback((key: keyof AppSettings, value: any) => {
    setAppSettings(s => {
      if (!s) return s;

      if (s[key] === value) {
        return s;
      }

      console.log(`settings: saving new local app settings for new [${key}]: ${value}`);

      const newSettings: AppSettings = {
        ...(s as AppSettings),
        [key]: value
      };
      return newSettings;
    });
  }, [setAppSettings]);

  const loadedAppSettings = async (): Promise<AppSettings | null> => {
    if (loadingPromiseRef.current.promise) {
      console.log('settings: loadedAppSettings returning existing loading promise');
      return loadingPromiseRef.current.promise;
    } else {
      console.log('settings: loadedAppSettings found no promise to return! (must be a very early call) - creating one');
      return createLoadingPromise();
    }
  };

  // restore local settings on mount and initialize persistence
  useEffect(() => {
    if (!loadedFlagRef.current) {
      loadedFlagRef.current = true;
      
      if (!loadingPromiseRef.current.promise) {
        createLoadingPromise();
        console.log('settings: mount effect is setting the init promise');
      } else {
        console.log('settings: mount effect is using existing init promise (must have been created by someone waiting)');
      }

      console.log('settings: not yet loaded');

      const settings = loadFromLocalStorage();
      if (settings) {
        console.log('settings: retrieved from localStorage');
        setAppSettings(settings);

        console.log('settings: setting persistence method');

        setPersistenceMethod(settings.persistenceMethod, settings.persistenceFolderName);

        if (isPathOauthCallback) {
          console.log('settings: on Oauth callback path - complete authorization then initialize persistence');
          completeOauthAndInitialize(settings.persistenceRememberMe);
        } else {
          console.log('settings: initializing persistence');
          initializePersistence().then(() => {
            console.log('settings: persistence initialized!');
          }).catch((initResult: PersistenceResult) => {
            console.log('settings: error completing persistence init:', initResult);
          });
        }
      } else {
        console.log('settings: no app settings defined yet (initial use)');
      }

      if (loadingPromiseRef.current.resolve) {
        loadingPromiseRef.current.resolve(settings);
      }
    }
  }, [isPathOauthCallback, initializePersistence, completeOauthAndInitialize, setAppSettings, setPersistenceMethod]);

  // save persistenceHasAuthorized
  useEffect(() => {
    if (lastPersistenceEvent === PersistenceEvent.Authorized) {
      saveSetting('persistenceHasAuthorized', true);
    } else if (lastPersistenceEvent === PersistenceEvent.RevokedAuth) {
      saveSetting('persistenceHasAuthorized', false);
    }
  }, [saveSetting, lastPersistenceEvent]);

  // store app settings when they're updated
  useEffect(() => {
    if (appSettings) {
      saveToLocalStorage(appSettings);
    }
  }, [appSettings]);
  
  const value = useMemo(() => ({
    appSettings, loadedAppSettings, hasSavedAppSettings, savePersistenceMethod
  }), [
    appSettings, loadedAppSettings, hasSavedAppSettings, savePersistenceMethod
  ]);

  return (
    <AppSettingsContext.Provider value={value}>
      { children }
    </AppSettingsContext.Provider>
  );
};
