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

const PERSISTENCE_METHOD_KEY = 'persistenceMethod';
const LAST_PROJECT_NAME_KEY = 'lastProjectName';

// TODO - Consider moving to an initialize effect in App component or similar
export const ClientSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { projectName } = useProjectData();
  const { setPersistenceMethod } = usePersistence();

  const persistenceMethod: PersistenceMethod | null = localStorage.getItem(PERSISTENCE_METHOD_KEY) as PersistenceMethod;
  const lastProjectName = localStorage.getItem(LAST_PROJECT_NAME_KEY);

  // save last project
  useEffect(() => {
    // todo - clear it also when project flows exist
    if (projectName && projectName !== '') {
      localStorage.setItem(LAST_PROJECT_NAME_KEY, projectName);
    }
  }, [projectName]);

  // restore local settings
  useEffect(() => {
    if (persistenceMethod) {
      setPersistenceMethod(persistenceMethod, lastProjectName);
    }
  }, []);
  
  const value = useMemo(() => ({
    persistenceMethod, lastProjectName
  }), [
    persistenceMethod, lastProjectName
  ]);

  return (
    <ClientSessionContext.Provider value={value}>
      { children }
    </ClientSessionContext.Provider>
  );
};
