import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PersistenceErrorStatus, PersistenceMethod, PersistenceStatus, Project } from '../../shared/data';
import { ExternalPersistenceStore, PersistenceContext, PersistenceStore } from './persistence-context';
import { useProjectData } from '../project-data-context';
import { GoogleDrivePersistenceStore } from './google-drive/google-drive-persistence-store';
import { LocalStoragePersistenceStore } from './local-storage-persistence-store';
import { persistenceSerialize } from './persistence-utils';

const GOOGLE_DRIVE_FOLDER_NAME = 'TST Projects';

export const PersistenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    projectName, transcriptLines, poeticStructures, topsOptions,
    loadDeserializedProjectData
  } = useProjectData();

  const [persistenceMethod, setPersistenceMethod] = useState<PersistenceMethod | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>(PersistenceStatus.Initializing);
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
      }
    }
  }, [store, setPersistenceStatus]);

  const createProject = useCallback(async (project: Project): Promise<void> => {
    if (store && (
      persistenceStatus === PersistenceStatus.IdleReady
      || persistenceStatus === PersistenceStatus.IdleSaved
    )) {
      setPersistenceStatus(PersistenceStatus.Paused);

      try {
        const hash = await store.createProject(project);
        setLastPersistenceHash(hash);
        setPersistenceStatus(PersistenceStatus.IdleSaved);
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
        throw(err);
      }
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash]);
  
  const loadProject = useCallback(async (projectName: string, storeOverride?: PersistenceStore | null): Promise<void> => {
    const storeToUse = storeOverride || store;
    if (storeToUse) {
      setPersistenceStatus(PersistenceStatus.Paused);

      try {
        const projectResponse = await storeToUse.fetchProject(projectName);
        if (projectResponse === null) {
          console.log('no existing project found with name', projectName);
          setPersistenceStatus(PersistenceStatus.IdleReady);
          return;
        }

        const { project, hash } = projectResponse;
        setLastPersistenceHash(hash);
        loadDeserializedProjectData(project);
        
        setTimeout(() => {
          setPersistenceStatus(PersistenceStatus.IdleReady);
        }, 1000);
        
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
        throw(err);
      }
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash, loadDeserializedProjectData]);

  const completeAuthorizeExternalAndInitializeStore = useCallback(async (newStore: ExternalPersistenceStore, lastProjectName?: string | null): Promise<void> => {
    await newStore.completeAuthorizeExternal();
        
    console.log('auth: cleaning up URL post auth callback');
    window.history.replaceState({}, '', window.location.origin);

    console.log('auth: complete. now calling store.initialize()');
    await newStore.initialize();

    console.log('init complete. now determining load operation....');
    const persistenceRecovery = sessionStorage.getItem('persistenceRecovery');
    const recoveredProject: Project = JSON.parse(persistenceRecovery || '{}');

    if (persistenceRecovery && lastProjectName && recoveredProject.projectName === lastProjectName) {
      // todo - give user a choice via modal
      console.log('load: recovering from persistenceRecovery');
      loadDeserializedProjectData(recoveredProject);
      sessionStorage.removeItem('persistenceRecovery');
      setPersistenceStatus(PersistenceStatus.IdleReady);
    } else if (lastProjectName) {
      console.log('load: loading last project from store', lastProjectName);
      await loadProject(lastProjectName, newStore);
    } else {
      console.log('load: no recovery or last project. persistence ready.');
      setPersistenceStatus(PersistenceStatus.IdleReady);
    }
  }, [loadDeserializedProjectData, loadProject, setPersistenceStatus]);

  const initializeStore = useCallback(async (newStore: PersistenceStore, lastProjectName?: string | null): Promise<void> => {
    await newStore.initialize();
    
    if (lastProjectName) {
      console.log('load: loading last project:', lastProjectName);
      await loadProject(lastProjectName, newStore);
    } else {
      setPersistenceStatus(PersistenceStatus.IdleReady);
    }
  }, [loadProject, setPersistenceStatus]);

  const setPersistenceMethodContext = useCallback(async (method: PersistenceMethod, lastProjectName?: string | null): Promise<void> => {
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
      newStore = new GoogleDrivePersistenceStore(GOOGLE_DRIVE_FOLDER_NAME);
    }

    setStore(newStore);

    const idx = window.location.pathname.indexOf(import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_PATH);
    const codeIdx = window.location.search.indexOf('code=');

    try {
      if (idx >= 0 && codeIdx >= 0 && method === PersistenceMethod.GoogleDrive) {
        console.log('auth: completing Google Drive auth before init');
        await completeAuthorizeExternalAndInitializeStore(newStore as ExternalPersistenceStore, lastProjectName);
      } else {
        await initializeStore(newStore as PersistenceStore, lastProjectName);
      }
    } catch (err) {
      setPersistenceStatus(err as PersistenceErrorStatus);
    } finally {
      lockRef.current = false;
      console.log('unlocked.');
    }
  }, [
    lockRef, persistenceMethod, setPersistenceMethod, setPersistenceStatus, setStore,
    completeAuthorizeExternalAndInitializeStore, initializeStore
  ]);

  const saveUpdate = useCallback(async (project: Project): Promise<void> => {
    if (store && (
      persistenceStatus === PersistenceStatus.IdleReady
      || persistenceStatus === PersistenceStatus.IdleSaved
    )) {
      setPersistenceStatus(PersistenceStatus.Saving);

      try {
        const hash = await store.updateProject(project);
        setLastPersistenceHash(hash);
        setPersistenceStatus(PersistenceStatus.IdleSaved);
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
        
        if (err === PersistenceStatus.ErrorUnauthorized) {
          console.log('saving to persistenceRecovery');
          sessionStorage.setItem('persistenceRecovery', persistenceSerialize(project));
        }
      }
    } else {
      console.log('skipping persistence update - status:', persistenceStatus);
      if (persistenceStatus === PersistenceStatus.ErrorUnauthorized) {
        console.log('saving to persistenceRecovery');
        sessionStorage.setItem('persistenceRecovery', persistenceSerialize(project));
      }
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash]);

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
        topsOptions
      });
    }
  }, [
    // intentionally incomplete
    transcriptLines, poeticStructures, topsOptions
  ]);

  const value = useMemo(() => ({
    persistenceMethod, setPersistenceMethod: setPersistenceMethodContext, 
    isPersistenceMethodExternal, lastPersistenceHash, persistenceStatus,
    authorizeExternal, revokeAuthorizeExternal, createProject, loadProject
  }), [
    persistenceMethod, setPersistenceMethodContext,
    isPersistenceMethodExternal, lastPersistenceHash, persistenceStatus,
    authorizeExternal, revokeAuthorizeExternal, createProject, loadProject
  ]);

  return (
    <PersistenceContext.Provider value={value}>
      { children }
    </PersistenceContext.Provider>
  );
};
