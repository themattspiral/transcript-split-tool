import { useCallback, useState } from 'react';

import { DefaultTOPSValues, PersistenceProjectFile, ProjectDataVersion, StylableProps } from 'data';
import { usePersistence } from 'context/persistence/persistence-context';
import { useProjectData } from 'context/project-data-context';

interface ProjectNameModalContentProps extends StylableProps {
  mode: 'new' | 'rename' | 'rename-loaded';
  currentName?: string | null;
  projectFileId?: string | null;
  onComplete: (file: PersistenceProjectFile) => void;
  onCancel: () => void;
}

export const ProjectNameModalContent: React.FC<ProjectNameModalContentProps> = props => {
  const { mode, currentName, projectFileId, onComplete, onCancel, className, style } = props;
  const { projectName } = useProjectData();
  const { createProject, renameProject, renameLoadedProject } = usePersistence();

  const currentNameToUse = mode === 'rename-loaded' ? projectName : currentName;
  const [newProjectName, setNewProjectName] = useState<string>(currentNameToUse || '');
  
  const isRename = mode ==='rename' || mode ==='rename-loaded';
  const isValid = newProjectName !== '' && (isRename ? newProjectName !== currentNameToUse : true);
  
  const handleSetName = useCallback(async () => {
    try {
      let promise: Promise<PersistenceProjectFile> | null = null;
      
      if (mode === 'rename-loaded') {
        promise = renameLoadedProject(newProjectName);
      } else if (mode === 'rename' && projectFileId) {
        promise = renameProject(projectFileId, newProjectName);
      } else if (mode === 'new') {
        promise = createProject({
          projectName: newProjectName,
          transcriptLines: [],
          poeticStructures: [],
          topsOptions: DefaultTOPSValues,
          dataVersion: ProjectDataVersion.v1
        });
      }

      if (promise) {
        onComplete(await promise);
      }
    } catch (err) {
      // show something errorful
    }
  }, [mode, projectFileId, newProjectName, createProject, renameProject, renameLoadedProject, onComplete]);

  return (
    <section className={className} style={style}>
      <h2 className="text-lg text-gray-600 font-semibold mb-2">
        { isRename
          ? `Rename Project "${currentNameToUse}"`
          : 'Create New Project'
        }
      </h2>

      <label className="block mb-2" htmlFor="new-project-name">
        { isRename ? 'New' : null } Name:

        <input
          type="text" id="new-project-name"
          className="ml-2 border-1 border-gray-600 p-1 w-full"
          defaultValue={currentNameToUse || undefined}
          onChange={event => setNewProjectName(event.target.value)}
        />
      </label>

      <div className="mt-4 flex gap-2 justify-end">
        <button
          type="button"
          className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-xl cursor-pointer"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="button"
          className="bg-yellow-600 hover:bg-yellow-700 hover:cursor-pointer disabled:bg-gray-300 disabled:cursor-default px-4 py-2 rounded-xl"
          disabled={!isValid}
          onClick={handleSetName}
        >
          { isRename ? 'Rename' : 'Create' } Project
        </button>
      </div>
    </section>
  );
};
