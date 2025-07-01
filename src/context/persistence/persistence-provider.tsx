import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PersistenceErrorStatus, PersistenceEvent, PersistenceMethod, PersistenceStatus, Project, ProjectDataVersion } from '../../shared/data';
import { ExternalPersistenceStore, PersistenceContext, PersistenceStore } from './persistence-context';
import { useProjectData } from '../project-data-context';
import { useViewState } from '../view-state-context';
import { GoogleDrivePersistenceStore } from './google-drive/google-drive-persistence-store';
import { LocalStoragePersistenceStore } from './local-storage-persistence-store';

const DEFAULT_EXTERNAL_STORE_FOLDER_NAME = 'TST Projects';

export const PersistenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    projectName, transcriptLines, poeticStructures, topsOptions,
    loadDeserializedProjectData
  } = useProjectData();
  const { infoModal, busyModal, hideModals } = useViewState();

  const [persistenceMethod, setPersistenceMethod] = useState<PersistenceMethod | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>(PersistenceStatus.Initializing);
  const [lastPersistenceEvent, setLastPersistenceEvent] = useState<PersistenceEvent | null>(null);
  const [lastPersistenceHash, setLastPersistenceHash] = useState<string | null>(null);

  const [store, setStore] = useState<PersistenceStore | null>(null);

  const lockRef = useRef<boolean>(false);

  const isPersistenceMethodExternal = store?.isExternal || false;

  const authorizeExternal = useCallback(() => {
    if (store && store.isExternal) {
      (store as ExternalPersistenceStore).authorizeExternal();
    }
  }, [store]);
  
  const revokeAuthorizeExternal = useCallback(async () => {
    if (store && store.isExternal) {
      try {
        await (store as ExternalPersistenceStore).revokeAuthorizeExternal();
      } finally {
        setPersistenceStatus(PersistenceStatus.ErrorUnauthorized);
        setLastPersistenceEvent(PersistenceEvent.Error);
      }
    }
  }, [store, setPersistenceStatus, setLastPersistenceEvent]);

  const createProject = useCallback(async (project: Project): Promise<void> => {
    if (store && persistenceStatus === PersistenceStatus.Idle) {
      setPersistenceStatus(PersistenceStatus.Paused);

      try {
        const hash = await store.createProject(project);
        setLastPersistenceHash(hash);
        setPersistenceStatus(PersistenceStatus.Idle);
        setLastPersistenceEvent(PersistenceEvent.Saved);
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
        setLastPersistenceEvent(PersistenceEvent.Error);
        throw(err);
      }
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash]);
  
  const loadProject = useCallback(async (projectName: string, storeOverride?: PersistenceStore | null): Promise<void> => {
    const storeToUse = storeOverride || store;
    if (storeToUse) {
      setPersistenceStatus(PersistenceStatus.Paused);
      busyModal(`Loading Project "${projectName}"...`);

      try {
        const projectResponse = await storeToUse.fetchProject(projectName);
        if (projectResponse === null) {
          console.log('no existing project found with name', projectName);
          setPersistenceStatus(PersistenceStatus.Idle);
          setLastPersistenceEvent(PersistenceEvent.NotFound);
          return;
        }

        const { project, hash } = projectResponse;
        setLastPersistenceHash(hash);

        try {
          loadDeserializedProjectData(project);
          setTimeout(() => {
            setPersistenceStatus(PersistenceStatus.Idle);
            setLastPersistenceEvent(PersistenceEvent.Loaded);
          }, 1000);
        } catch (err) {
          setPersistenceStatus(PersistenceStatus.ErrorData);
          setLastPersistenceEvent(PersistenceEvent.Error);
        }
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
        setLastPersistenceEvent(PersistenceEvent.Error);
        throw(err);
      } finally {
        hideModals();
      }
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash, loadDeserializedProjectData, setLastPersistenceEvent]);

  const completeAuthorizeExternalAndInitializeStore = useCallback(async (newStore: ExternalPersistenceStore, rememberMe: boolean, lastProjectName?: string | null): Promise<void> => {
    try {
      await newStore.completeAuthorizeExternal(rememberMe);
    } finally {
      console.log('auth: cleaning up URL post auth callback');
      window.history.replaceState({}, '', window.location.origin);
    }

    console.log('auth: complete. now calling store.initialize()');
    await newStore.initialize();

    console.log('init complete.');

    if (lastProjectName) {
      console.log('load: loading last project from store:', lastProjectName);
      await loadProject(lastProjectName, newStore);
    } else {
      console.log('load: no last project. persistence is ready.');
      setPersistenceStatus(PersistenceStatus.Idle);
    }
  }, [loadDeserializedProjectData, loadProject, setPersistenceStatus, setLastPersistenceEvent]);

  const initializeStore = useCallback(async (newStore: PersistenceStore, lastProjectName?: string | null): Promise<void> => {
    await newStore.initialize();
    
    if (lastProjectName) {
      console.log('load: loading last project:', lastProjectName);
      await loadProject(lastProjectName, newStore);
    } else {
      setPersistenceStatus(PersistenceStatus.Idle);
    }
  }, [loadProject, setPersistenceStatus, setLastPersistenceEvent]);

  const setPersistenceMethodPublic = useCallback(async (
    method: PersistenceMethod,
    rememberMe: boolean,
    persistenceFolderName: string | null,
    lastProjectName: string | null
  ): Promise<void> => {
    if (lockRef.current === true) {
      console.log('already locked - not setting persistence method again');
      return;
    } else if (persistenceMethod === method) {
      console.log('persistence method already set (not setting again):', method);
      return;
    } else {
      lockRef.current = true;
      console.log('locked. setting new persistence method', method);
    }

    setPersistenceMethod(method);
    setPersistenceStatus(PersistenceStatus.Initializing);

    let newStore: PersistenceStore | null = null;
    if (method === PersistenceMethod.SessionOnly) {
      // todo
    } else if (method === PersistenceMethod.BrowserLocal) {
      newStore = new LocalStoragePersistenceStore();
    } else if (method === PersistenceMethod.GoogleDrive) {
      newStore = new GoogleDrivePersistenceStore(persistenceFolderName || DEFAULT_EXTERNAL_STORE_FOLDER_NAME);
    }

    setStore(newStore);

    const idx = window.location.pathname.indexOf(import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_PATH);
    const codeIdx = window.location.search.indexOf('code=');

    try {
      if (method === PersistenceMethod.GoogleDrive && idx >= 0) {
        if (codeIdx >= 0) {
          console.log('auth: completing Google Drive auth before init. rememberMe:', rememberMe);
          busyModal(`Finishing Google Drive Setup...`);

          await completeAuthorizeExternalAndInitializeStore(newStore as ExternalPersistenceStore, rememberMe, lastProjectName);
        } else {
          console.log('auth: incomplete.');

          setPersistenceStatus(PersistenceStatus.ErrorUnauthorized);
          setLastPersistenceEvent(PersistenceEvent.Error);

          console.log('auth: cleaning up URL post auth callback');
          window.history.replaceState({}, '', window.location.origin);

          await infoModal('Google Drive Setup was not completed due to user cancellation or an error.');
        }
      } else {
        await initializeStore(newStore as PersistenceStore, lastProjectName);
      }
    } catch (err) {
      setPersistenceStatus(err as PersistenceErrorStatus);
      setLastPersistenceEvent(PersistenceEvent.Error);
    } finally {
      lockRef.current = false;
      console.log('unlocked.');
      hideModals();
    }
  }, [
    lockRef, persistenceMethod, setPersistenceMethod, setPersistenceStatus, setStore,
    completeAuthorizeExternalAndInitializeStore, initializeStore, setLastPersistenceEvent
  ]);

  const saveUpdate = useCallback(async (project: Project): Promise<void> => {
    if (store && persistenceStatus === PersistenceStatus.Idle) {
      setPersistenceStatus(PersistenceStatus.Saving);

      try {
        const hash = await store.updateProject(project);
        setLastPersistenceHash(hash);
        setPersistenceStatus(PersistenceStatus.Idle);
        setLastPersistenceEvent(s => {
          return s === PersistenceEvent.Recovered ? PersistenceEvent.RecoveredAndSaved : PersistenceEvent.Saved;
        });
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
        setLastPersistenceEvent(PersistenceEvent.Error);
        console.log('persistence update failed - status:', err);
      }
    } else {
      console.log('skipping persistence update - status:', persistenceStatus);
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash, setLastPersistenceEvent]);

  // temp
  useEffect(() => {
    console.log('persistenceStatus changed:', persistenceStatus);
  }, [persistenceStatus]);

  // save project when any changes occur
  useEffect(() => {
    if (projectName) {
      saveUpdate({
        projectName,
        transcriptLines,
        poeticStructures: Object.values(poeticStructures),
        topsOptions,
        dataVersion: ProjectDataVersion.v1
      });
    }
  }, [
    // intentionally incomplete
    transcriptLines, poeticStructures, topsOptions
  ]);

  const value = useMemo(() => ({
    persistenceMethod, setPersistenceMethod: setPersistenceMethodPublic, 
    isPersistenceMethodExternal, lastPersistenceHash, persistenceStatus, lastPersistenceEvent,
    authorizeExternal, revokeAuthorizeExternal, createProject, loadProject
  }), [
    persistenceMethod, setPersistenceMethodPublic,
    isPersistenceMethodExternal, lastPersistenceHash, persistenceStatus, lastPersistenceEvent,
    authorizeExternal, revokeAuthorizeExternal, createProject, loadProject
  ]);

  return (
    <PersistenceContext.Provider value={value}>
      { children }
    </PersistenceContext.Provider>
  );
};
