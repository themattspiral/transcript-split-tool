import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { useViewState } from 'context/view-state-context';
import { usePersistence } from 'context/persistence/persistence-context';
import { useAppSettings } from 'context/app-settings-context';
import { PersistenceResult } from 'data';

export const SettingsPage: React.FC = () => {
  const { completeAuthorizeExternal, initializePersistence, isPathOauthCallback } = usePersistence();
  const { busyModal, infoModal, hideModals } = useViewState();
  const { appSettings } = useAppSettings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const completedAuthRef = useRef<boolean>(false);

  useEffect(() => {
    if (appSettings && isPathOauthCallback && !completedAuthRef.current) {
      completedAuthRef.current = true;
      
      console.log('settings page - isPathOauthCallback is true!');
      busyModal(`Finishing Google Drive Setup...`);

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        infoModal(`Error completing authorization. Incorrect params from Oauth provider.`);
        console.error('settings page - no code or state found in query params:', searchParams.toString());
        return;
      }

      completeAuthorizeExternal(code, state, appSettings?.persistenceRememberMe || false).then(() => {
        console.log('settings page - authorized!');
        console.log('settings page - initial url cleanup');
        window.history.replaceState({}, '', '/settings');

        console.log('settings page - initializing persistence');
        
        initializePersistence().then(() => {
          console.log('settings page - persistence initialized!');
          if (appSettings?.lastProjectName) {
            console.log('settings page - navigate to /transcript');
            navigate('/transcript', { replace: true });
          } else {
            console.log('settings page - navigate to /settings (finish url cleanup)');
            hideModals();
            navigate('/settings', { replace: true });
          }
        }).catch((initResult: PersistenceResult) => {
          console.log('settings page - error completing init:', initResult);
          infoModal(`Error completing init. Persistence status: ${initResult.persistenceStatus}`)
          navigate('/settings', { replace: true });
        });
      }).catch((authResult: PersistenceResult) => {
        console.log('settings page - error completing auth:', authResult);
        infoModal(`Error completing authorization. Persistence status: ${authResult.persistenceStatus}`)
        navigate('/settings', { replace: true });
      });
    } else {
      // console.log(`settings page - isPathOauthCallback (${isPathOauthCallback}) is false or no appSettings yet (${appSettings})`);
    }
  }, [appSettings, isPathOauthCallback]);

  return (
    <div>Settings</div>
  );
};
