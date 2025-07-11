import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotate } from '@fortawesome/free-solid-svg-icons';

import { PersistenceProjectFile, PersistenceResult } from 'data';
import { usePersistence } from 'context/persistence/persistence-context';
import { useViewState } from 'context/view-state-context';
import { ProjectNameModalContent } from 'components/project-name-modal-content';

export const ProjectsListPage: React.FC = () => {
  const { listProjects, deleteProject, projectFilesList, hasMoreProjectFiles, garbleAccessToken } = usePersistence();
  const { confirmModal, busyModal, infoModal, hideModals } = useViewState();
  const navigate = useNavigate();
  
  const [selectedProjectFile, setSelectedProjectFile] = useState<PersistenceProjectFile | null>(null);

  const loadList = useCallback(async (isNextPageFetch: boolean = false): Promise<void> => {
    console.log('projects list page: calling listProjects()');
    listProjects(isNextPageFetch).then(() => {}).catch((err) => {
      console.error('error fetching projects list:', err);
    });
  }, [listProjects, setSelectedProjectFile]);

  const deleteProj = useCallback(async (projectFile: PersistenceProjectFile | null): Promise<void> => {
    if (!projectFile) {
      return;
    }

    try {
      await confirmModal(`Are you sure you want to delete project "${projectFile.projectName}"?`);
    } catch (cancelled) {
      return;
    }

    busyModal(`Deleting project "${projectFile.projectName}"...`);
    deleteProject(projectFile.fileId).then(() => {
      console.log('deleted', projectFile);
      setSelectedProjectFile(null);
      hideModals();
    }).catch((err: PersistenceResult) => {
      console.error(err);
      infoModal(`An error occurred deleting project file. Status: ${err.persistenceStatus}`);
    });
  }, [deleteProject, setSelectedProjectFile]);

  useEffect(() => {
    setSelectedProjectFile(null);

    if (!projectFilesList) {
      loadList();
    }
  }, [
    // intentionally incomplete
    projectFilesList
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
          className={classNames('block bg-green-400 hover:bg-green-500 text-white cursor-pointer px-4 py-2 mb-4 rounded-xl font-medium')}
          type="button"
          onClick={() => busyModal((
            <ProjectNameModalContent
              mode='new'
              onComplete={(file) => {
                hideModals();
                navigate(`/project/${file.fileId}/transcript`);
              }}
              onCancel={hideModals}
            />
          ), true)}
        >
          New Project...
        </button>

        <h2 className="text-lg text-gray-500 font-semibold flex gap-2 items-center mb-2">
          Projects List:

          <button
            className="flex items-center justify-center hover:bg-gray-300 cursor-pointer p-1 w-[30px] h-[30px] rounded-full overflow-hidden"
            type="button"
            onClick={() => loadList()}
          >
            <FontAwesomeIcon icon={faRotate} className="w-4 h-4" />
          </button>  
        </h2>
        
        <section className="ml-4 mr-4">
          <div>
            
            <div
              className="grid font-semibold text-gray-600 border-b-1 border-gray-600 pb-1 mb-2 px-4"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 0.25fr' }}
            >
              <div>Project Name</div>
              <div>Created</div>
              <div>Last Modified</div>
              <div>Rev #</div>
            </div>

            { projectFilesList?.map(file => {
              const isSelected = file.fileId === selectedProjectFile?.fileId;
              return (
                <div
                  key={file.fileId}
                  className="[&:not(:last-child)]:border-b-1 border-gray-300 py-[2px]"
                >
                  <div
                    className={classNames(
                      'pb-1 pt-1 cursor-pointer grid px-4 rounded-2xl select-none',
                      { 'bg-blue-400 text-white': isSelected,
                        'hover:bg-gray-300': !isSelected
                      }
                    )}
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 0.25fr' }}
                    onClick={() => {
                      setSelectedProjectFile(selFile => selFile?.fileId === file.fileId ? null : file);
                    }}
                    onDoubleClick={() => {
                      navigate(`/project/${file.fileId}/transcript`);
                    }}
                  >
                    <div className="font-semibold">{ file.projectName }</div>
                    <div>{ new Date(file.createdTime).toLocaleString() }</div>
                    <div>{ new Date(file.modifiedTime).toLocaleString() }</div>
                    <div>{ file.version }</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          { hasMoreProjectFiles &&
            <button
              className="block text-blue-500 p-1 mt-1 hover:font-semibold cursor-pointer"
              type="button"
              onClick={() => loadList(true)}
            >
              See More
            </button>
          }

          <div className="flex gap-4 mt-4">
            <button
              className={classNames('block bg-blue-400 hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-default text-white cursor-pointer px-4 py-2 rounded-xl font-medium')}
              type="button"
              disabled={!selectedProjectFile}
              onClick={() => {
                navigate(`/project/${selectedProjectFile?.fileId}/transcript`);
              }}
            >
              Open Project
            </button>

            <button
              className={classNames('block bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-default text-white cursor-pointer px-4 py-2 rounded-xl font-medium')}
              type="button"
              disabled={!selectedProjectFile}
              onClick={() => deleteProj(selectedProjectFile)}
            >
              Delete Project
            </button>

            <button
              className={classNames('block bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-default text-white cursor-pointer px-4 py-2 rounded-xl font-medium')}
              type="button"
              disabled={!selectedProjectFile}
              onClick={() => busyModal((
                <ProjectNameModalContent
                  mode='rename'
                  currentName={selectedProjectFile?.projectName}
                  projectFileId={selectedProjectFile?.fileId}
                  onComplete={() => {
                    setSelectedProjectFile(null);
                    hideModals();
                  }}
                  onCancel={hideModals}
                />
              ), true)}
            >
              Rename Project
            </button>
          </div>

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
