import { createContext, useContext } from 'react';

import { PersistenceEvent, PersistenceMethod, PersistenceResult, PersistenceStatus, Project } from 'data';

interface PersistenceContextProps {
  persistenceMethod: PersistenceMethod | null;
  setPersistenceMethod: (persistenceMethod: PersistenceMethod, persistenceFolderName: string | null) => void;
  initializePersistence: () => Promise<PersistenceResult>;

  isPersistenceMethodExternal: boolean;
  isPathOauthCallback: boolean;
  lastPersistenceEvent: PersistenceEvent | null;
  lastPersistenceHash: string | null;
  persistenceStatus: PersistenceStatus;

  loadProject: (projectName: string) => Promise<PersistenceResult>;
  createProject: (project: Project) => Promise<void>;

  // rename
  // list, search
  // delete
  // check name uniqueness

  authorizeExternal: () => void;
  completeAuthorizeExternal: (code: string, state: string, rememberMe: boolean) => Promise<PersistenceResult>;
  revokeAuthorizeExternal: () => Promise<void>;
}

export const PersistenceContext = createContext<PersistenceContextProps>({
  persistenceMethod: null,
  setPersistenceMethod: () => {},
  initializePersistence: () => Promise.reject(0),

  isPersistenceMethodExternal: false,
  isPathOauthCallback: false,
  lastPersistenceEvent: null,
  lastPersistenceHash: null,
  persistenceStatus: PersistenceStatus.Initializing,

  loadProject: () => Promise.reject(0),
  createProject: () => Promise.reject(0),

  authorizeExternal: () => {},
  completeAuthorizeExternal: () => Promise.reject(0),
  revokeAuthorizeExternal: () => Promise.reject(0)
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
  completeAuthorizeExternal: (code: string, state: string, rememberMe: boolean) => Promise<void>;
  revokeAuthorizeExternal: () => Promise<void>;
}
