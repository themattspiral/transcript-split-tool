import { useCallback, useEffect, useMemo, useState } from 'react';

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

  const setPersistenceMethodExternal = useCallback(async (method: PersistenceMethod, initialProjectName?: string | null) => {
    if (persistenceMethod !== method) {
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
      };
    }
  }, [persistenceMethod, setPersistenceMethod, setPersistenceStatus]);

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
    // pause, create file, set hash, unpause, resolve

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
        // todo - check err?
        setPersistenceStatus(err as PersistenceErrorStatus);
        throw(err);
      }
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash]);
  
  const loadProject = useCallback(async (projectName: string, storeOverride?: PersistenceStore | null): Promise<void> => {
    // pause, find file, fetch file & metadata, set hash, set project data etc, unpause, resolve

    const storeToUse = storeOverride || store;
    if (storeToUse
    //   persistenceStatus === PersistenceStatus.Initializing
    //   || persistenceStatus === PersistenceStatus.IdleReady
    //   || persistenceStatus === PersistenceStatus.IdleSaved
    ) {
      setPersistenceStatus(PersistenceStatus.Paused);

      try {
        const projectResponse = await storeToUse.fetchProject(projectName);
        if (projectResponse === null) {
          console.log('no existing project found with name', projectName);
          return;
        }

        const { project, hash } = projectResponse;
        setLastPersistenceHash(hash);

        setProjectName(project.projectName);
        setNewTranscript(project.transcriptLines);
        setTopsOptions(project.topsOptions);

        project.poeticStructures.forEach(nonClassStructure => {
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
      }
    }
  }, [store, persistenceStatus, setPersistenceStatus, setLastPersistenceHash]);

  // process callback
  useEffect(() => {
    if (store) {
      const idx = window.location.pathname.indexOf('/google-oauth2-callback');
      if (idx > -1) {
        console.log('on callback url:', window.location.pathname);

        (store as ExternalPersistenceStore).completeAuthorizeExternal()
          .then(() => {
            setPersistenceStatus(PersistenceStatus.Initializing);
          }).then(() => {
            return store?.initialize();
          }).then(() => {
            setPersistenceStatus(PersistenceStatus.IdleReady);
          })
          .catch((err: PersistenceErrorStatus) => {
            setPersistenceStatus(err);
          });
      }
    }
  }, [store, setPersistenceStatus]);

  useEffect(() => {
    console.log('persistenceStatus:', persistenceStatus);
    
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
