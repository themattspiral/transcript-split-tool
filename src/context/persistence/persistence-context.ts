import { createContext, useContext } from 'react';

import {
  PersistenceEvent, PersistenceMethod, PersistenceProjectFile, PersistenceProjectFilesResponse,
  PersistenceResult, PersistenceStatus, Project
} from 'data';

interface PersistenceContextProps {
  persistenceMethod: PersistenceMethod | null;
  setPersistenceMethod: (persistenceMethod: PersistenceMethod, persistenceFolderName: string | null) => void;
  initializePersistence: () => Promise<PersistenceResult>;

  isPersistenceMethodExternal: boolean;
  isPathOauthCallback: boolean;
  lastPersistenceEvent: PersistenceEvent | null;
  persistenceStatus: PersistenceStatus;

  loadProject: (projectFileId: string) => Promise<PersistenceResult>;
  createProject: (project: Project) => Promise<PersistenceProjectFile>;
  listProjects: (nextPageToken?: string | null) => Promise<PersistenceProjectFilesResponse>;
  deleteProject: (projectFileId: string) => Promise<void>;

  // rename
  // list, search
  // delete
  // check name uniqueness

  authorizeExternal: () => void;
  completeAuthorizeExternal: (code: string, state: string, rememberMe: boolean) => Promise<PersistenceResult>;
  revokeAuthorizeExternal: () => Promise<void>;

  garbleAccessToken?: any;
}

export const PersistenceContext = createContext<PersistenceContextProps>({
  persistenceMethod: null,
  setPersistenceMethod: () => {},
  initializePersistence: () => Promise.reject(0),

  isPersistenceMethodExternal: false,
  isPathOauthCallback: false,
  lastPersistenceEvent: null,
  persistenceStatus: PersistenceStatus.Initializing,

  loadProject: () => Promise.reject(0),
  createProject: () => Promise.reject(0),
  listProjects: () => Promise.reject(0),
  deleteProject: () => Promise.reject(0),

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
  readonly requiresUniqueNames: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  fetchProject: (projectFileId: string) => Promise<Project | null>;
  createProject: (project: Project) => Promise<PersistenceProjectFile>;
  updateProject: (projectFileId: string, project: Project) => Promise<PersistenceProjectFile>;
  
  listProjects: (nextPageToken?: string | null) => Promise<PersistenceProjectFilesResponse>;
  deleteProject: (projectFileId: string) => Promise<void>;

  // rename
  // list, search
  // delete
  // check name uniqueness

  garbleAccessToken?: any;
}

export interface ExternalPersistenceStore extends PersistenceStore {
  authorizeExternal: () => void;
  completeAuthorizeExternal: (code: string, state: string, rememberMe: boolean) => Promise<void>;
  revokeAuthorizeExternal: () => Promise<void>;
}
