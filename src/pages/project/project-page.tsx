import { Outlet } from 'react-router-dom';

import { ControlBar } from 'pages/project/control-bar/control-bar';
import { useAppSettings } from 'context/app-settings-context';
import { useProjectData } from 'context/project-data-context';
import { usePersistence } from 'context/persistence/persistence-context';
import { useEffect } from 'react';
import { useViewState } from 'context/view-state-context';
import { PersistenceEvent, PersistenceResult } from 'data';
import { useLocation } from 'react-router';

export const ProjectPage: React.FC = () => {
  const { loadedAppSettings } = useAppSettings();
  const { projectName } = useProjectData();
  const { loadProject } = usePersistence();
  const { busyModal, infoModal, hideModals } = useViewState();
  const location = useLocation();

  useEffect(() => {
    console.log('project page - waiting on loaded app settings');
    loadedAppSettings().then(appSettings => {
    console.log('project page - got loaded app settings');
      let projectToLoad: string | null = null;

      if (appSettings && location.state?.projectName) {
        projectToLoad = location.state.projectName;
        console.log('project page - LOADING PROJECT from STATE param:', location.state.projectName);
      } else if (!projectName && appSettings?.lastProjectName) {
        projectToLoad = appSettings.lastProjectName;
        console.log('project page - LOADING LAST PROJECT from settings:', appSettings.lastProjectName);
      }

      if (projectToLoad) {
        busyModal(`Loading project [${projectToLoad}]...`);

        loadProject(projectToLoad).then(() => {
          console.log('project page - loaded project!');
          hideModals();
        }).catch((result: PersistenceResult) => {
          if (result.lastPersistenceEvent === PersistenceEvent.ProjectNotFound) {
            infoModal(`Project [${projectToLoad}] was not found.`)
            console.log('project page - not found!');
          } else {
            console.log('project page - error:', result);
            infoModal(`An error was encountered while loading project [${projectToLoad}]: ${result.persistenceStatus}`)
          }
        });
      } else {
        // console.log('project page - NO ACTION', projectName, appSettings?.lastProjectName);
      }
    });
  }, [
    // intentionally empty
  ]);

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
