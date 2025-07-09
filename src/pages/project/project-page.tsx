import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Outlet } from 'react-router-dom';

import { PersistenceEvent, PersistenceResult } from 'data';
import { ControlBar } from 'pages/project/control-bar/control-bar';
import { usePersistence } from 'context/persistence/persistence-context';
import { useViewState } from 'context/view-state-context';

export const ProjectPage: React.FC = () => {
  const { loadProject } = usePersistence();
  const { busyModal, infoModal, hideModals } = useViewState();
  const { projectFileId } = useParams();

  useEffect(() => {
    if (!projectFileId) {
      console.error('project page - no projectFileId found in URL params!');
      infoModal(`Project file ID was not found.`);
      return;
    }

    busyModal(`Loading Project...`);

    loadProject(projectFileId).then(() => {
      console.log('project page - loaded project!');
      hideModals();
    }).catch((result: PersistenceResult) => {
      if (result.lastPersistenceEvent === PersistenceEvent.ProjectNotFound) {
        infoModal(`Project with file ID [${projectFileId}] was not found.`)
        console.log('project page - not found!');
      } else {
        console.log('project page - error:', result);
        infoModal(`An error was encountered while loading project with fileId [${projectFileId}]: ${result.persistenceStatus}`)
      }
    });
  }, [projectFileId]);

  return (
    <main className="flex flex-col p-2 overflow-hidden">

      <ControlBar />
      
      <div className="overflow-hidden grow-1 border-gray-300 border-8 rounded-t flex flex-col shadow-md shadow-gray-400">

        {/* will be routed to either TranscriptView or StructuresView */}
        <Outlet />

      </div>

    </main>
  );
};
