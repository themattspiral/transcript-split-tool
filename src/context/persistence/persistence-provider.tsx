import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PersistenceErrorStatus, PersistenceMethod, PersistenceStatus, Phrase, PoeticStructure, PoeticStructureRelationshipType, Project } from '../../shared/data';
import { ExternalPersistenceStore, PersistenceContext, PersistenceStore } from './persistence-context';
import { useProjectData } from '../project-data-context';
import { GoogleDrivePersistenceStore } from './google-drive/google-drive-persistence-store';

const GOOGLE_DRIVE_FOLDER_NAME = 'TST Projects';

export const PersistenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    projectName, transcriptLines, poeticStructures, topsOptions,
    setProjectName, setNewTranscript, addPoeticStructure, setTopsOptions
  } = useProjectData();

  const [persistenceMethod, setPersistenceMethod] = useState<PersistenceMethod | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>(PersistenceStatus.Initializing);
  const [lastPersistenceHash, setLastPersistenceHash] = useState<string | null>(null);

  const [store, setStore] = useState<PersistenceStore | null>(null);

  const lockRef = useRef<boolean>(false);

  const authorizeExternal = useCallback(() => {
    if (store && (store as ExternalPersistenceStore).authorizeExternal) {
      (store as ExternalPersistenceStore).authorizeExternal();
    }
  }, [store]);
  
  const revokeAuthorizeExternal = useCallback(async () => {
    if (store && (store as ExternalPersistenceStore).revokeAuthorizeExternal) {
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
  
  const loadDeserializedProjectData = useCallback((deserializedProject: Project) => {
    // TODO - SCRUB POTENTIALLY DANGEROUS INPUT

    setProjectName(deserializedProject.projectName);
    setNewTranscript(deserializedProject.transcriptLines);
    setTopsOptions(deserializedProject.topsOptions);

    deserializedProject.poeticStructures.forEach(nonClassStructure => {
      const repetition = new Phrase(
        nonClassStructure.repetition.lineNumber,
        nonClassStructure.repetition.start,
        nonClassStructure.repetition.end
      );
      const sources = nonClassStructure.sources.map(source => {
        return new Phrase(
          source.lineNumber,
          source.start,
          source.end
        );
      });
      
      const structure = new PoeticStructure(
        repetition, sources, nonClassStructure.relationshipType as PoeticStructureRelationshipType,
        nonClassStructure.topsId, nonClassStructure.topsNotes, nonClassStructure.syntax, nonClassStructure.notes
      );
      
      addPoeticStructure(structure);
    });
  }, [setProjectName, setNewTranscript, setTopsOptions, addPoeticStructure]);

  const loadProject = useCallback(async (projectName: string, storeOverride?: PersistenceStore | null): Promise<void> => {
    const storeToUse = storeOverride || store;
    if (storeToUse) {
      setPersistenceStatus(PersistenceStatus.Paused);

      try {
        const projectResponse = await storeToUse.fetchProject(projectName);
        if (projectResponse === null) {
          console.log('no existing project found with name', projectName);
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
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash]);

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
          sessionStorage.setItem('persistenceRecovery', JSON.stringify(project));
        }
      }
    } else {
      console.log('skipping persistence update - status:', persistenceStatus);
      if (persistenceStatus === PersistenceStatus.ErrorUnauthorized) {
        console.log('saving to persistenceRecovery');
        sessionStorage.setItem('persistenceRecovery', JSON.stringify(project));
      }
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash]);

  const setPersistenceMethodExternal = useCallback(async (method: PersistenceMethod, initialProjectName?: string | null) => {
    if (lockRef.current === true) {
      console.log('already locked - not setting persistence method again');
      return;
    } else {
      lockRef.current = true;
      console.log('locked.');
    }

    if (persistenceMethod === method) {
      console.log('persistence method already set:', method);

      lockRef.current = false;
      console.log('unlocked.');

      return;
    }

    console.log('setting new persistence method', method);
    setPersistenceMethod(method);
    setPersistenceStatus(PersistenceStatus.Initializing);

    let newStore: PersistenceStore | null = null;
    if (method === PersistenceMethod.SessionOnly) {
      // todo
    } else if (method === PersistenceMethod.BrowserLocal) {
      // todo
    } else if (method === PersistenceMethod.GoogleDrive) {
      newStore = new GoogleDrivePersistenceStore(GOOGLE_DRIVE_FOLDER_NAME);
    }

    setStore(newStore);

    const idx = window.location.pathname.indexOf('/google-oauth2-callback');
    const codeIdx = window.location.search.indexOf('code=');

    if (idx >= 0 && codeIdx >= 0 && newStore) {
      console.log('completing auth');
      (newStore as ExternalPersistenceStore).completeAuthorizeExternal()
        .then(() => {
          console.log('cleaning up URL post auth callback');
          window.history.replaceState({}, '', window.location.origin);

          console.log('calling store.initialize()');
          return newStore.initialize();
        }).then(() => {
          console.log('determining load operation....');
          const lastProjectName = localStorage.getItem('lastProjectName');
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
            return loadProject(lastProjectName, newStore);
          } else {
            console.log('load: no recovery or last project. persistence ready.');
            setPersistenceStatus(PersistenceStatus.IdleReady);
          }
        })
        .catch((err) => {
          setPersistenceStatus(err);
        }).finally(() => {
          lockRef.current = false;
          console.log('unlocked.');
        });
    } else {
      try {
        await newStore?.initialize();
        
        if (initialProjectName) {
          console.log('loading project', initialProjectName);
          await loadProject(initialProjectName, newStore);
        } else {
          setPersistenceStatus(PersistenceStatus.IdleReady);
        }
      } catch (err) {
        setPersistenceStatus(err as PersistenceErrorStatus);
      } finally {
        lockRef.current = false;
        console.log('unlocked.');
      };
    }
  }, [
    lockRef, persistenceMethod,
    setPersistenceMethod, setPersistenceStatus, loadDeserializedProjectData, loadProject
  ]);

  useEffect(() => {
    console.log('persistenceStatus changed:', persistenceStatus);
    
    if (persistenceStatus === PersistenceStatus.ErrorUnauthorized) {
      // show modal error
    }
  }, [persistenceStatus]);

  // save (update existing) project when any changes occur
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
    persistenceMethod, setPersistenceMethod: setPersistenceMethodExternal, lastPersistenceHash, persistenceStatus,
    authorizeExternal, revokeAuthorizeExternal, createProject, loadProject
  }), [
    persistenceMethod, setPersistenceMethodExternal, lastPersistenceHash, persistenceStatus,
    authorizeExternal, revokeAuthorizeExternal, createProject, loadProject
  ]);

  return (
    <PersistenceContext.Provider value={value}>
      { children }
    </PersistenceContext.Provider>
  );
};
