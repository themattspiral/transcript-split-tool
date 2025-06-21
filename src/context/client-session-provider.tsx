import { useEffect, useMemo } from 'react';

import { ClientSessionContext } from './client-session-context';
import { useProjectData } from './project-data-context';
import { PersistenceMethod } from '../shared/data';
import { usePersistence } from './persistence/persistence-context';

/* Client Session Provider 
  - Provides browser session continuity by storing information about the last project
    the user was working on in localStorage
  - Initiates reload of a session (last project and view settings) on app init
*/

// TODO - Consider moving to an initialize effect in App component or similar
export const ClientSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { projectName } = useProjectData();
  const { setPersistenceMethod } = usePersistence();

  const persistenceMethod: PersistenceMethod | null = localStorage.getItem('persistenceMethod') as PersistenceMethod;
  const lastProjectName = localStorage.getItem('lastProjectName');
  
  // TODO - eliminate this? (always fetch or create first)
  const lastPersistenceHash = localStorage.getItem('lastPersistenceHash');

  // TODO remove effect, make it iexplicit
  useEffect(() => {
    if (projectName && projectName !== '') {
      localStorage.setItem('lastProjectName', projectName || '');
    }
  }, [projectName]);

  // restore local settings
  useEffect(() => {
    if (persistenceMethod) {
      setPersistenceMethod(persistenceMethod, lastProjectName);
    }
  }, []);
  
  const value = useMemo(() => ({
    persistenceMethod, lastPersistenceHash, lastProjectName
  }), [
    persistenceMethod, lastPersistenceHash, lastProjectName
  ]);

  return (
    <ClientSessionContext.Provider value={value}>
      { children }
    </ClientSessionContext.Provider>
  );
};
