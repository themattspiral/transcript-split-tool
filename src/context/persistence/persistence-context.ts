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

  createProject: (project: Project) => Promise<PersistenceProjectFile>;
  loadProject: (projectFileId: string) => Promise<void>;
  deleteProject: (projectFileId: string) => Promise<void>;
  renameProject: (projectFileId: string, name: string) => Promise<PersistenceProjectFile>;
  renameLoadedProject: (name: string) => Promise<PersistenceProjectFile>;
  listProjects: (useNextPageToken: boolean) => Promise<void>;

  projectFilesList: PersistenceProjectFile[] | null;
  hasMoreProjectFiles: boolean;

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

  createProject: () => Promise.reject(0),
  loadProject: () => Promise.reject(0),
  deleteProject: () => Promise.reject(0),
  renameProject: () => Promise.reject(0),
  renameLoadedProject: () => Promise.reject(0),
  listProjects: () => Promise.reject(0),

  projectFilesList: null,
  hasMoreProjectFiles: false,

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
  createProjectFile: (project: Project) => Promise<PersistenceProjectFile>;
  fetchProjectContents: (projectFileId: string) => Promise<Project | null>;
  updateProjectFile: (projectFileId: string, project: Project) => Promise<PersistenceProjectFile>;
  deleteProjectFile: (projectFileId: string) => Promise<void>;
  renameProjectFile: (projectFileId: string, name: string) => Promise<PersistenceProjectFile>;
  listProjectFiles: (nextPageToken?: string | null) => Promise<PersistenceProjectFilesResponse>;
  garbleAccessToken?: any;
}

export interface ExternalPersistenceStore extends PersistenceStore {
  authorizeExternal: () => void;
  completeAuthorizeExternal: (code: string, state: string, rememberMe: boolean) => Promise<void>;
  revokeAuthorizeExternal: () => Promise<void>;
}
