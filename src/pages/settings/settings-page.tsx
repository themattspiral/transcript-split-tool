import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { useViewState } from 'context/view-state-context';
import { usePersistence } from 'context/persistence/persistence-context';
import { useAppSettings } from 'context/app-settings-context';
import { PersistenceEvent } from 'data';

export const SettingsPage: React.FC = () => {
  const { completeAuthorizeExternal, initializePersistence, isPathOauthCallback } = usePersistence();
  const { busyModal, infoModal, hideModals } = useViewState();
  const { appSettings } = useAppSettings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (appSettings && isPathOauthCallback) {
      console.log('settings page - isPathOauthCallback is true!');
      busyModal(`Finishing Google Drive Setup...`);

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        infoModal(`Error completing authorization. Incorrect params from Oauth provider.`);
        console.error('settings page - no code or state found in query params:', searchParams.toString());
        return;
      }

      completeAuthorizeExternal(code, state, appSettings?.persistenceRememberMe || false).then(authResut => {
        if (authResut.lastPersistenceEvent === PersistenceEvent.Authorized) {
          console.log('settings page - authorized!');
          console.log('settings page - initial url cleanup');
          window.history.replaceState({}, '', '/settings');

          console.log('settings: initializing persistence');
          initializePersistence().then(initResult => {

            if (initResult.lastPersistenceEvent === PersistenceEvent.Initialized) {
              console.log('settings page - persistence initialized!');

              console.log('settings: navigate');
              if (appSettings?.lastProjectName) {
                navigate('/transcript', { replace: true });
              } else {
                hideModals();
                navigate('/settings', { replace: true });
              }
            } else {
              console.log('settings page - error completing init:', initResult);
              infoModal(`Error completing init. Persistence status: ${initResult.persistenceStatus}`)
              navigate('/settings', { replace: true });
            }
          });
        } else {
          console.log('settings page - error completing auth:', authResut);
          infoModal(`Error completing authorization. Persistence status: ${authResut.persistenceStatus}`)
          navigate('/settings', { replace: true });
        }
      });
    } else {
      console.log(`settings page - isPathOauthCallback (${isPathOauthCallback}) is false or no appSettings yet (${appSettings})`);
    }
  }, [appSettings, isPathOauthCallback]);

  return (
    <div>Settings</div>
  );
};
