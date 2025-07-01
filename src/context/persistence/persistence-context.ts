import { createContext, useContext } from 'react';

import { PersistenceEvent, PersistenceMethod, PersistenceStatus, Project } from '../../shared/data';

interface PersistenceContextProps {
  persistenceMethod: PersistenceMethod | null;
  setPersistenceMethod: (
    persistenceMethod: PersistenceMethod,
    persistenceRememberMe: boolean,
    initialProjectName: string | null
  ) => Promise<void>;
  isPersistenceMethodExternal: boolean;
  lastPersistenceEvent: PersistenceEvent | null;
  lastPersistenceHash: string | null;
  persistenceStatus: PersistenceStatus;
  loadProject: (projectName: string, storeOverride?: PersistenceStore | null) => Promise<void>;
  createProject: (project: Project) => Promise<void>;

  // rename
  // list, search
  // delete
  // check name uniqueness

  authorizeExternal: () => void;
  revokeAuthorizeExternal: () => Promise<void>;
}

export const PersistenceContext = createContext<PersistenceContextProps>({
  persistenceMethod: null,
  setPersistenceMethod: () => Promise.reject(),
  isPersistenceMethodExternal: false,
  lastPersistenceEvent: null,
  lastPersistenceHash: null,
  persistenceStatus: PersistenceStatus.Initializing,
  loadProject: () => Promise.reject(),
  createProject: () => Promise.reject(),

  authorizeExternal: () => {},
  revokeAuthorizeExternal: () => Promise.reject()
});

export const usePersistence = () => {
  const context = useContext(PersistenceContext);
  if (!context) {
    throw new Error(`usePersistence must be used within a PersistenceProvider`);
  }
  return context;
};

export interface PersistenceStore {
  readonly isExternal: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  fetchProject: (projectName: string) => Promise<{ project: Project, hash: string} | null>;
  createProject: (project: Project) => Promise<string>;
  updateProject: (project: Project) => Promise<string>;

  // rename
  // list, search
  // delete
  // check name uniqueness
}

export interface ExternalPersistenceStore extends PersistenceStore {
  authorizeExternal: () => void;
  completeAuthorizeExternal: (rememberMe: boolean) => Promise<void>;
  revokeAuthorizeExternal: () => Promise<void>;
}
