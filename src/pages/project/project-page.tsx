import { Outlet } from 'react-router-dom';

import { ControlBar } from 'pages/project/control-bar/control-bar';
import { useAppSettings } from 'context/app-settings-context';
import { useProjectData } from 'context/project-data-context';
import { usePersistence } from 'context/persistence/persistence-context';
import { useEffect } from 'react';
import { useViewState } from 'context/view-state-context';
import { PersistenceEvent, PersistenceResult } from 'data';

export const ProjectPage: React.FC = () => {
  const { appSettings } = useAppSettings();
  const { projectName } = useProjectData();
  const { loadProject } = usePersistence();
  const { busyModal, infoModal, hideModals } = useViewState();

  useEffect(() => {
    if (!projectName && appSettings?.lastProjectName) {
      console.log('project page - LOADING LAST PROJECT:', appSettings.lastProjectName);
      busyModal(`Loading last project [${appSettings.lastProjectName}]...`);

      loadProject(appSettings.lastProjectName).then(() => {
        console.log('project page - loaded project!');
        hideModals();
      }).catch((result: PersistenceResult) => {
        if (result.lastPersistenceEvent === PersistenceEvent.ProjectNotFound) {
          infoModal(`Last project [${appSettings.lastProjectName}] was not found.`)
          console.log('project page - not found!');
        } else {
          console.log('project page - error:', result);
          infoModal(`An error was encountered while loading last project [${appSettings.lastProjectName}]: ${result.persistenceStatus}`)
        }
      });
    } else {
      // console.log('project page - NO ACTION', projectName, appSettings?.lastProjectName);
    }
  }, [projectName, appSettings]);

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
