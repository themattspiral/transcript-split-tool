import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMatch } from 'react-router';

import { PersistenceErrorStatus, PersistenceEvent, PersistenceMethod, PersistenceStatus, PersistenceResult, Project, ProjectDataVersion } from 'data';
import { ExternalPersistenceStore, PersistenceContext, PersistenceStore } from './persistence-context';
import { useProjectData } from 'context/project-data-context';
import { GoogleDrivePersistenceStore } from './google-drive/google-drive-persistence-store';
import { LocalStoragePersistenceStore } from './local-storage-persistence-store';

const DEFAULT_EXTERNAL_STORE_FOLDER_NAME = 'TST Projects';

export const PersistenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    projectName, transcriptLines, poeticStructures, topsOptions, loadDeserializedProjectData
  } = useProjectData();
  const [persistenceMethod, setPersistenceMethod] = useState<PersistenceMethod | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>(PersistenceStatus.Initializing);
  const [lastPersistenceEvent, setLastPersistenceEvent] = useState<PersistenceEvent | null>(null);
  const [lastPersistenceHash, setLastPersistenceHash] = useState<string | null>(null);
  
  const storeRef = useRef<PersistenceStore | null>(null);
  const isPersistenceMethodExternal = storeRef.current?.isExternal || false;
  const isPathOauthCallback = !!useMatch(import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_PATH);
  
  const initializingRef = useRef<{
    promise: Promise<void> | null,
    resolve: (() => void) | null;
    reject: ((reason: PersistenceResult) => void) | null;
  }>({
    promise: null,
    resolve: null,
    reject: null
  });

  const setPersistenceMethodPublic = useCallback((method: PersistenceMethod, persistenceFolderName: string | null) => {
    setPersistenceMethod(method);
    setPersistenceStatus(PersistenceStatus.Initializing);

    const promise = new Promise<void>((resolve, reject) => {
      initializingRef.current.resolve = resolve;
      initializingRef.current.reject = reject;
    });
    initializingRef.current.promise = promise;

    if (method === PersistenceMethod.SessionOnly) {
      // todo
    } else if (method === PersistenceMethod.BrowserLocal) {
      storeRef.current = new LocalStoragePersistenceStore();
    } else if (method === PersistenceMethod.GoogleDrive) {
      storeRef.current = new GoogleDrivePersistenceStore(persistenceFolderName || DEFAULT_EXTERNAL_STORE_FOLDER_NAME);
    }
  }, [setPersistenceMethod, setPersistenceStatus]);
  
  const authorizeExternal = useCallback(() => {
    (storeRef.current as ExternalPersistenceStore).authorizeExternal();
  }, []);
  
  const revokeAuthorizeExternal = useCallback(async () => {
    try {
      await (storeRef.current as ExternalPersistenceStore).revokeAuthorizeExternal();
    } finally {
      setPersistenceStatus(PersistenceStatus.ErrorUnauthorized);
      setLastPersistenceEvent(PersistenceEvent.Error);
    }
  }, [setPersistenceStatus, setLastPersistenceEvent]);
  
  const completeAuthorizeExternal = useCallback(async (code: string, state: string, rememberMe: boolean): Promise<PersistenceResult> => {
    console.log('persistence: completing Google Drive auth');
    
    try {
      await (storeRef.current as ExternalPersistenceStore).completeAuthorizeExternal(code, state, rememberMe);

      setPersistenceStatus(PersistenceStatus.Initializing);
      setLastPersistenceEvent(PersistenceEvent.Authorized);

      return {
        persistenceStatus: PersistenceStatus.Initializing,
        lastPersistenceEvent: PersistenceEvent.Authorized
      };
    } catch (err) {
      setPersistenceStatus(err as PersistenceErrorStatus);
      setLastPersistenceEvent(PersistenceEvent.Error);

      throw {
        persistenceStatus: err as PersistenceErrorStatus,
        lastPersistenceEvent: PersistenceEvent.Error
      };
    }
  }, [setPersistenceStatus, setLastPersistenceEvent]);

  const initializePersistence = useCallback(async (): Promise<PersistenceResult> => {
    try {
      await storeRef.current?.initialize();

      setPersistenceStatus(PersistenceStatus.Idle);
      setLastPersistenceEvent(PersistenceEvent.Initialized);

      if (initializingRef.current.resolve) {
        initializingRef.current.resolve();
      }

      return {
        persistenceStatus: PersistenceStatus.Idle,
        lastPersistenceEvent: PersistenceEvent.Initialized
      };
    } catch (err) {
      setPersistenceStatus(err as PersistenceErrorStatus);
      setLastPersistenceEvent(PersistenceEvent.Error);

      if (initializingRef.current.reject) {
        initializingRef.current.reject({
          persistenceStatus: err as PersistenceErrorStatus,
          lastPersistenceEvent: PersistenceEvent.Error
        });
      }

      throw {
        persistenceStatus: err as PersistenceErrorStatus,
        lastPersistenceEvent: PersistenceEvent.Error
      };
    }
  }, [setPersistenceStatus, setLastPersistenceEvent]);

  const waitForInit = useCallback(async (): Promise<void> => {
    console.log('waitForInit - storeRef.current?.isInitialized:', storeRef.current?.isInitialized);
    if (storeRef.current?.isInitialized) {
      return;
    }

    if (initializingRef.current.promise) {
      console.log('waitForInit - returning exisiting promise', initializingRef.current.promise);
      return initializingRef.current.promise;
    } else {
      console.error('waitForInit: no promise to return!');
      throw new Error('waitForInit: No Promise to return in initializingRef.current.promise.');
    }
  }, [persistenceStatus, lastPersistenceEvent]);

  const loadProject = useCallback((projectName: string): Promise<PersistenceResult> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('load: waiting for init to complete');
        await waitForInit();
        console.log('load: done waiting');
      } catch (err) {
        console.log('load: rejecting with init error');
        return reject(err as PersistenceResult);
      }

      setPersistenceStatus(PersistenceStatus.Paused);
      console.log('load: pausing persistence');
      
      try {
        const projectResponse = await storeRef.current?.fetchProject(projectName);

        if (!projectResponse) {
          console.log('load: no existing project found with name:', projectName);
          setPersistenceStatus(PersistenceStatus.Idle);
          setLastPersistenceEvent(PersistenceEvent.ProjectNotFound);

          return reject({
            persistenceStatus: PersistenceStatus.Idle,
            lastPersistenceEvent: PersistenceEvent.ProjectNotFound
          });
        }

        const { project, hash } = projectResponse;
        setLastPersistenceHash(hash);

        try {
          console.log('load: putting fetched data into current project context');
          loadDeserializedProjectData(project);

          setTimeout(() => {
            console.log('load: done - success');
            setPersistenceStatus(PersistenceStatus.Idle);
            setLastPersistenceEvent(PersistenceEvent.ProjectLoaded);

            resolve({
              persistenceStatus: PersistenceStatus.Idle,
              lastPersistenceEvent: PersistenceEvent.ProjectLoaded
            });
          }, 1000);
        } catch (err) {
          console.log('load: data error');
          throw PersistenceStatus.ErrorData;
        }
      } catch (err) {
        console.log('load: error:', err);
        setPersistenceStatus(err as PersistenceErrorStatus);
        setLastPersistenceEvent(PersistenceEvent.Error);
        
        reject({
          persistenceStatus: err as PersistenceErrorStatus,
          lastPersistenceEvent: PersistenceEvent.Error
        });
      }
    });
  }, [waitForInit, setPersistenceStatus, setLastPersistenceHash, loadDeserializedProjectData, setLastPersistenceEvent]);

  const createProject = useCallback(async (project: Project): Promise<void> => {
    if (persistenceStatus === PersistenceStatus.Idle) {
      setPersistenceStatus(PersistenceStatus.Paused);

      try {
        const hash = await storeRef.current?.createProject(project);
        if (hash) {
          setLastPersistenceHash(hash);
        }
        setPersistenceStatus(PersistenceStatus.Idle);
        setLastPersistenceEvent(PersistenceEvent.ProjectSaved);
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
        setLastPersistenceEvent(PersistenceEvent.Error);
        // todo update to behave like load
        throw(err);
      }
    }
  }, [persistenceStatus, setPersistenceStatus, setLastPersistenceHash]);




    // temp
  useEffect(() => {
    console.log('INFO persistenceStatus changed:', persistenceStatus);
  }, [persistenceStatus]);

  const saveUpdate = useCallback(async (project: Project): Promise<void> => {
    if (persistenceStatus === PersistenceStatus.Idle) {
      setPersistenceStatus(PersistenceStatus.Saving);

      try {
        const hash = await storeRef.current?.updateProject(project);
        if (hash) {
          setLastPersistenceHash(hash);
        }
        setPersistenceStatus(PersistenceStatus.Idle);
        setLastPersistenceEvent(PersistenceEvent.ProjectSaved);
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
        setLastPersistenceEvent(PersistenceEvent.Error);
        console.error('persistence: project update save failed - status:', err);
      }
    } else {
      console.log('persistence: skipping update save - status:', persistenceStatus);
    }
  }, [persistenceStatus, setPersistenceStatus, setLastPersistenceHash, setLastPersistenceEvent]);

  // save project when any changes occur
  useEffect(() => {
    if (projectName) {
      console.log('persistence: triggering project save...');

      saveUpdate({
        projectName,
        transcriptLines,
        poeticStructures: Object.values(poeticStructures),
        topsOptions,
        dataVersion: ProjectDataVersion.v1
      });
    }
  }, [
    // intentionally limited
    transcriptLines, poeticStructures, topsOptions
  ]);

  const value = useMemo(() => ({
    persistenceMethod, setPersistenceMethod: setPersistenceMethodPublic, initializePersistence,
    isPersistenceMethodExternal, isPathOauthCallback,
    lastPersistenceHash, persistenceStatus, lastPersistenceEvent,
    loadProject, createProject,
    authorizeExternal, completeAuthorizeExternal, revokeAuthorizeExternal
  }), [
    persistenceMethod, setPersistenceMethodPublic, initializePersistence,
    isPersistenceMethodExternal, isPathOauthCallback,
    lastPersistenceHash, persistenceStatus, lastPersistenceEvent,
    loadProject, createProject,
    authorizeExternal, completeAuthorizeExternal, revokeAuthorizeExternal
  ]);

  return (
    <PersistenceContext.Provider value={value}>
      { children }
    </PersistenceContext.Provider>
  );
};
