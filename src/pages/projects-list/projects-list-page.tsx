import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ProjectFile, usePersistence } from 'context/persistence/persistence-context';

export const ProjectsList: React.FC = () => {
  const { listProjects } = usePersistence();
  
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  useEffect(() => {
      console.log('projects list page: calling listProjects()');
      listProjects().then(({ projectFiles, nextPageToken }) => {
        setProjectFiles(projectFiles);
        setNextPageToken(nextPageToken);
      }).catch((err) => {
        console.error('error fetching projects list:', err);
      });
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
        
        <section className="ml-4 mr-4">
          <h2 className="text-lg text-gray-600 font-semibold">Projects List:</h2>

          <div>
            { projectFiles.map(file => (
              <Link
                key={file.fileName}  
                to="/project/transcript"
                state={{ projectName: file.projectName }}
                className="block pb-1 pt-1 pl-2 pr-2 hover:bg-blue-200"
              >
                <span className="font-semibold">{ file.projectName } --</span> created: { file.createdTime } modified: { file.modifiedTime } version: { file.version }
              </Link>
            )) }
          </div>
          
          { nextPageToken &&
            <button
              className="block text-blue-400 p-2 mt-1"
              type="button"
              onClick={() => {
                console.log('projects list page: calling listProjects() see more');
                listProjects(nextPageToken).then(({ projectFiles, nextPageToken }) => {
                  setProjectFiles(pf => pf.concat(projectFiles));
                  setNextPageToken(nextPageToken);
                }).catch((err) => {
                  console.error('error fetching projects list:', err);
                });
              }}
            >
              See More
            </button>
          }
          
          <button
            className="block bg-yellow-500 p-2 mt-4"
            type="button"
            onClick={() => {
              console.log('projects list page: calling listProjects() to refresh');
              listProjects().then(({ projectFiles, nextPageToken }) => {
                setProjectFiles(projectFiles);
                setNextPageToken(nextPageToken);
              }).catch((err) => {
                console.error('error fetching projects list:', err);
              });
            }}
          >
            Refresh
          </button>

        </section>

      </section>
    </main>
  );
};
