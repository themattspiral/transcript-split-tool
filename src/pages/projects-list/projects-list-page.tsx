import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import classNames from 'classnames';

import { DefaultTOPSValues, PersistenceProjectFile, PersistenceResult, ProjectDataVersion } from 'data';
import { usePersistence } from 'context/persistence/persistence-context';
import { useViewState } from 'context/view-state-context';
import { useProjectData } from 'context/project-data-context';

export const ProjectsListPage: React.FC = () => {
  const { listProjects, deleteProject, createProject, garbleAccessToken } = usePersistence();
  const { confirmModal, busyModal, infoModal, hideModals } = useViewState();
  const { unloadProjectData } = useProjectData();
  const navigate = useNavigate();
  
  const [projectFiles, setProjectFiles] = useState<PersistenceProjectFile[] | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedProjectFile, setSelectedProjectFile] = useState<PersistenceProjectFile | null>(null);

  const NewProjectModalContents: React.FC = () => {
    const [newProjectName, setNewProjectName] = useState<string>('');

    return (
      <div>
        <h2>Create New Project!</h2>

        <label className="block mb-1" htmlFor="new-project-name">
          Name: 
          <input
            type="text" id="new-project-name"
            className="ml-2 border-1 border-gray-600 p-1 w-full"
            onChange={event => {
              setNewProjectName(event.target.value);
            }}
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            className="bg-gray-400 px-2 py-1"
            onClick={hideModals}
          >
            Cancel
          </button>

          <button
            type="button"
            className="bg-gray-400 px-2 py-1"
            onClick={() => {
              createProject({
                projectName: newProjectName,
                transcriptLines: [],
                poeticStructures: [],
                topsOptions: DefaultTOPSValues,
                dataVersion: ProjectDataVersion.v1
              }).then(projectFile => {
                hideModals();
                navigate(`/project/${projectFile.fileId}/transcript`);
              }).catch((err: PersistenceResult) => {
                infoModal(`An error occurred creating the new project file. Status: ${err.persistenceStatus}`)
              });
            }}
          >
            Create
          </button>
        </div>
      </div>
    );
  };

  const fetchList = useCallback(async (isNextPageFetch?: boolean, token?: string): Promise<void> => {
    if (!isNextPageFetch) {
      console.log('projects list page: clearing all data');
      setProjectFiles([]);
      setNextPageToken(null);
      setSelectedProjectFile(null);
    }
    
    console.log('projects list page: calling listProjects()');
    listProjects(isNextPageFetch && token ? token : null).then(({ projectFiles: files, nextPageToken: npt }) => {
      setProjectFiles(pf => isNextPageFetch && pf ? pf.concat(files) : files);
      setNextPageToken(npt);
    }).catch((err) => {
      console.error('error fetching projects list:', err);
    });
  }, [listProjects, setProjectFiles, setNextPageToken, setSelectedProjectFile]);

  const deleteProj = useCallback(async (projectFile: PersistenceProjectFile | null): Promise<void> => {
    if (!projectFile) {
      return;
    }

    try {
      await confirmModal(`Are you sure you want to delete project "${projectFile.projectName}"?`);
    } catch (cancelled) {
      return;
    }

    deleteProject(projectFile.fileId).then(() => {
      console.log('deleted', projectFile);
      setProjectFiles(pf => (pf || []).filter(file => file.fileId !== projectFile.fileId));
      setSelectedProjectFile(null);
    }).catch((err: PersistenceResult) => {
      console.error(err);
      infoModal(`An error occurred deleting project file. Status: ${err.persistenceStatus}`);
    });
  }, [deleteProject, setProjectFiles, setSelectedProjectFile]);

  useEffect(() => {
    unloadProjectData();
    fetchList();
  }, [
    // intentionally empty
  ]);

  return (
    <main className='flex flex-col items-center'>
      <section className='w-[75%] h-dvh border-l-1 border-r-1 border-grey-600 p-2'>

        <h1 className="flex items-center mb-8">
          <div className="grow-1 text-2xl text-gray-600 flex justify-center items-center">
            Poetic Structure Transcript Split Tool - Projects List
          </div>
        </h1>

        <button
          className={classNames('block bg-green-400 hover:bg-green-500 text-white cursor-pointer p-2 mb-4')}
          type="button"
          onClick={() => busyModal(<NewProjectModalContents />)}
        >
          New Project...
        </button>
        
        <section className="ml-4 mr-4">
          <h2 className="text-lg text-gray-600 font-semibold flex gap-2 items-center mb-2">
            Projects List:

            <button
              className="block bg-yellow-500 hover:bg-yellow-600 cursor-pointer p-1 text-sm"
              type="button"
              onClick={() => fetchList()}
            >
              Refresh
            </button>  
          </h2>

          <div>
            { projectFiles?.map(file => {
              const isSelected = file.fileId === selectedProjectFile?.fileId;
              return (
                <div
                  key={file.fileId}
                  className={classNames(
                    'pb-1 pt-1 pl-2 pr-2 cursor-pointer',
                    { 'bg-blue-200': isSelected,
                      'hover:bg-gray-300': !isSelected
                    }
                  )}
                  onClick={() => {
                    setSelectedProjectFile(selFile => selFile?.fileId === file.fileId ? null : file);
                  }}
                  onDoubleClick={() => {
                    navigate(`/project/${file.fileId}/transcript`);
                  }}
                >
                  <span className="font-semibold">{ file.projectName } --</span> created: { file.createdTime } modified: { file.modifiedTime } version: { file.version }
                </div>
              );
            })}
          </div>
          <div>{ projectFiles === undefined ? 'undefined' : '' }</div>
          
          { nextPageToken &&
            <button
              className="block text-blue-500 p-1 mt-1 hover:font-semibold cursor-pointer"
              type="button"
              onClick={() => fetchList(true, nextPageToken)}
            >
              See More
            </button>
          }

          <button
            className={classNames('block bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-default text-white cursor-pointer p-2 mt-4')}
            type="button"
            disabled={!selectedProjectFile}
            onClick={() => {
              navigate(`/project/${selectedProjectFile?.fileId}/transcript`);
            }}
          >
            Open Project
          </button>

          <button
            className={classNames('block bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-default text-white cursor-pointer p-2 mt-4')}
            type="button"
            disabled={!selectedProjectFile}
            onClick={() => deleteProj(selectedProjectFile)}
          >
            Delete
          </button>

          <button
            className="bg-red-400 cursor-pointer hover:bg-red-500 p-1 mt-10"
            onClick={garbleAccessToken}
          >
            Garble Token
          </button>

        </section>

      </section>
    </main>
  );
};
