import { createContext, useContext } from 'react';

import { PersistenceMethod } from '../shared/data';

interface ClientSessionContextProps {
  persistenceMethod: PersistenceMethod | null;
  lastProjectName: string | null;
}

export const ClientSessionContext = createContext<ClientSessionContextProps>({
  persistenceMethod: null,
  lastProjectName: null
});

export const useClientSession = () => {
  const context = useContext(ClientSessionContext);
  if (!context) {
    throw new Error(`useClientSession must be used within a ClientSessionProvider`);
  }
  return context;
};
