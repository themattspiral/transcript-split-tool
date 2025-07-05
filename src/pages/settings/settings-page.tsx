import { NavLink } from 'react-router-dom';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleArrowLeft, faHouseChimney, faGear } from '@fortawesome/free-solid-svg-icons';

import { PersistenceMethod, PersistenceStatus } from 'data';
import { useAppSettings } from 'context/app-settings-context';
import { usePersistence } from 'context/persistence/persistence-context';

export const SettingsPage: React.FC = () => {
  const { appSettings, savePersistenceMethod } = useAppSettings();
  const { persistenceStatus, setPersistenceMethod, initializePersistence, authorizeExternal, revokeAuthorizeExternal } = usePersistence();
  const isAuthorized = appSettings?.persistenceHasAuthorized && persistenceStatus !== PersistenceStatus.ErrorUnauthorized;

  return (
    <main className='flex flex-col items-center'>
      <section className='w-[75%] h-dvh border-l-1 border-r-1 border-grey-600 p-2'>

        <h1 className="flex items-center mb-8">
          <NavLink to="/" className="text-xl text-gray-600">
            <FontAwesomeIcon icon={faCircleArrowLeft} className="mr-1" size="lg" />
            <FontAwesomeIcon icon={faHouseChimney} size="lg" />
          </NavLink>

          <div className="grow-1 text-2xl text-gray-600 flex justify-center items-center">
            <FontAwesomeIcon icon={faGear} className="mr-2" size="lg" />
            App Settings
          </div>
        </h1>
        
        <section className="ml-4 mr-4">
          <h2 className="mb-3 text-xl text-gray-600">Your Storage Method:</h2>

          <div className="flex flex-col pl-3">

            <div>
              <label className="block mb-1" htmlFor="persistence-type-googledrive">
                <input
                  type="radio" id="persistence-type-googledrive" name="persistence-type-options"
                  className="mr-1"
                  disabled={isAuthorized}
                  value={PersistenceMethod.GoogleDrive}
                  checked={appSettings?.persistenceMethod === PersistenceMethod.GoogleDrive}
                  onChange={() => {
                    savePersistenceMethod(PersistenceMethod.GoogleDrive, appSettings?.persistenceRememberMe);
                    setPersistenceMethod(PersistenceMethod.GoogleDrive, null);
                  }}
                />

                Google Drive
              </label>

              <label htmlFor="remember-me-googledrive" className="block ml-4 mb-1">
                Remember Me:

                <input
                  type="checkbox" id="remember-me-googledrive"
                  className="ml-1"
                  disabled={isAuthorized}
                  checked={appSettings?.persistenceRememberMe || false}
                  onChange={() => {
                    savePersistenceMethod(PersistenceMethod.GoogleDrive, !appSettings?.persistenceRememberMe);
                  }}
                />
              </label>

              <button
                type="button"
                disabled={appSettings?.persistenceMethod !== PersistenceMethod.GoogleDrive}
                onClick={() => {
                  if (isAuthorized) {
                    revokeAuthorizeExternal();
                  } else {
                    authorizeExternal();
                  }
                }}
                className={classNames(
                  'px-4 py-2 rounded cursor-pointer flex items-center ml-4 mb-6',
                  isAuthorized ? 'bg-violet-400 hover:bg-violet-500 text-white' : 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                { isAuthorized ? 'Revoke Drive' : 'Authorize Drive' }
              </button>
            </div>

            <label htmlFor="persistence-type-browserlocal">
              <input
                type="radio" id="persistence-type-browserlocal" name="persistence-type-options"
                className="mr-1"
                disabled={isAuthorized}
                value={PersistenceMethod.BrowserLocal}
                checked={appSettings?.persistenceMethod === PersistenceMethod.BrowserLocal}
                onChange={() => {
                  savePersistenceMethod(PersistenceMethod.BrowserLocal, appSettings?.persistenceRememberMe);
                  setPersistenceMethod(PersistenceMethod.BrowserLocal, null);
                  initializePersistence();
                }}
              />

              Browser Local Storage
            </label>
          </div>
          

        </section>

      </section>
    </main>
  );
};
