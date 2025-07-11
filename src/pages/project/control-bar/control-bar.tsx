import { CSSProperties, useMemo, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { extractRawText } from 'mammoth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWord } from '@fortawesome/free-regular-svg-icons';
import { faCircleArrowLeft, faHouseChimney, faGears, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { TranscriptLine } from 'data';
import { useProjectData } from 'context/project-data-context';
import { usePersistence } from 'context/persistence/persistence-context';
import { useViewState } from 'context/view-state-context';
import { ProjectNameModalContent } from 'components/project-name-modal-content';

const AUTHOR_RE = new RegExp(/^[a-zA-Z]{1,20}:\s/);

const ControlBar: React.FC = () => {
  const { projectName, setNewTranscript, poeticStructures, setProjectName } = useProjectData();
  const { persistenceStatus, lastPersistenceEvent } = usePersistence();
  const { busyModal, hideModals } = useViewState();

  const psCount = useMemo(() => Object.keys(poeticStructures).length, [poeticStructures])
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      console.log('No file. Event target (input):', event?.target);
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await extractRawText({ arrayBuffer });
      
      // split on newline, filter out empty lines, and transform
      const lines: TranscriptLine[] = result.value
        .split('\n')
        .filter(line => line.trim() !== '')
        .map((line, idx) => {
          const tl: TranscriptLine = {
            lineNumber: idx + 1,
            text: line,
            speaker: ''
          };

          // split out author
          const matches = AUTHOR_RE.exec(line);
          if (matches?.length) {
            const speaker: string = matches[0];

            // remove final ": " for speaker 
            tl.speaker = speaker.substring(0, speaker.length - 2);
            tl.text = line.substring(speaker.length);
          }

          return tl;
        });

        // empty placeholder in index 0, to make all lineNumber values match index
        lines.unshift({} as TranscriptLine);

        setNewTranscript(lines);

      if (result.messages?.length) {
        console.log('Document Parsing Messages:', result.messages);
      }

      // clear input so it may be reused with the same file if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Error processing document. Please try again.');
    }
  };

  const activeTabClasses = 'bg-gray-300 px-3 pt-1 pb-2 rounded-t-lg text-nowrap';
  const otherTabClasses = 'bg-gray-200 hover:bg-gray-300 px-3 pt-1 pb-2 rounded-t-lg cursor-pointer text-nowrap';
  const activeBoxShadow: CSSProperties = { boxShadow: '2px 2px 6px rgba(0,0,0,.5)' };
  
  return (
    <div className="flex gap-4 items-end">
    
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".docx"
        className="hidden"
      />

      {/* Left Side Container */}
      <div className="pb-2 h-full grow-1 flex gap-2 items-center">

        <Link to="/" className="text-xl text-gray-600 hover:text-blue-400 ml-2 mr-2 shrink-0">
          <FontAwesomeIcon icon={faCircleArrowLeft} className="mr-1" size="lg" />
          <FontAwesomeIcon icon={faHouseChimney} size="lg" />
        </Link>
      
        <div className="min-w-20 grow-1 shrink-1 flex items-center">
          <h1 className="text-xl text-gray-600 font-semibold text-ellipsis overflow-hidden whitespace-nowrap">
            { projectName }
          </h1>

          <button
            className="shrink-0 ml-1 flex items-center justify-center hover:bg-gray-300 text-gray-500 cursor-pointer p-1 w-[30px] h-[30px] rounded-full overflow-hidden"
            type="button"
            onClick={() => busyModal((
              <ProjectNameModalContent
                mode='rename-loaded'
                onComplete={projectFile => {
                  setProjectName(projectFile.projectName);
                  hideModals();
                }}
                onCancel={hideModals}
              />
            ), true)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
          </button> 
        </div>

        <div className="basis-2 grow-1 shrink-2" />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer flex items-center"
        >
          Import Transcript
          <FontAwesomeIcon icon={faFileWord} className="ml-2" size="lg" />
        </button>

        <div className='flex flex-col shrink-0'>
          <span>Persistence Status: { persistenceStatus?.toString() }</span>
          <span>Last Persistence Event: { lastPersistenceEvent }</span>
        </div>

        <Link
          to="settings"
          className="shrink-0 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 cursor-pointer flex items-center"
        >
          Project Settings
          <FontAwesomeIcon icon={faGears} size="lg" className="ml-1" />
        </Link>
        
      </div>

      {/* Right Side Container */}
      <div className="ml-auto mr-2 h-full flex flex-col gap-1">
        <div className="flex justify-end text-gray-300 text-xs">
          v{import.meta.env.PACKAGE_VERSION}
        </div>

        <div className="flex gap-2 font-medium grow-1 items-end">
          <NavLink
            to="transcript"
            className={({ isActive }) => isActive ? activeTabClasses : otherTabClasses}
            style={({ isActive }) => isActive ? activeBoxShadow : {}}
          >
            Transcript!
          </NavLink>
          
          <NavLink
            to="structures"
            className={({ isActive }) => isActive ? activeTabClasses : otherTabClasses}
            style={({ isActive }) => isActive ? activeBoxShadow : {}}
          >
            Poetic Structures ({ psCount })
          </NavLink>
          
        </div>
      </div>

    </div>
  );
};

export { ControlBar };
