import { useMemo, useRef } from 'react';
import { extractRawText } from 'mammoth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWord, faFileExcel } from '@fortawesome/free-regular-svg-icons';
import classNames from 'classnames';

import { TranscriptLine, TabId, PersistenceStatus } from '../shared/data';
import { useViewState } from '../context/view-state-context';
import { useProjectData } from '../context/project-data-context';
import { usePersistence } from '../context/persistence/persistence-context';

const AUTHOR_RE = new RegExp(/^[a-zA-Z]{1,20}:\s/);

const ControlBar: React.FC = () => {
  const { activeTabId, setActiveTabId } = useViewState();
  const { transcriptLines, setNewTranscript, poeticStructures } = useProjectData();
  const {
    persistenceStatus, isPersistenceMethodExternal, persistenceMethod, lastPersistenceEvent,
    authorizeExternal, revokeAuthorizeExternal
} = usePersistence();

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
  const isAuthorized = persistenceStatus !== PersistenceStatus.ErrorUnauthorized;
  
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
      <div className="pb-2 h-full grow-1 flex gap-2">
        
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer flex items-center"
          >
            Import New Transcript
            <FontAwesomeIcon icon={faFileWord} className="ml-2" size="lg" />
          </button>

          <button
            type="button"
            onClick={() => {}}
            disabled={transcriptLines.length === 0}
            className={`px-4 py-2 rounded flex items-center ${
              transcriptLines.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
            }`}
          >
            Export Grid
            <FontAwesomeIcon icon={faFileExcel}  className="ml-2" size="lg" />
          </button>
          
          { isPersistenceMethodExternal &&
            <button
              type="button"
              onClick={() => {
                if (isAuthorized) {
                  revokeAuthorizeExternal();
                } else {
                  authorizeExternal();
                }
              }}
              className={classNames(
                ' px-4 py-2 rounded cursor-pointer flex items-center',
                isAuthorized ? 'bg-violet-400 hover:bg-violet-500 text-white' : 'bg-amber-500 hover:bg-amber-600'
              )}
            >
              { isAuthorized ? 'Revoke Drive' : 'Authorize Drive' }
            </button>
          }

          <div className='flex flex-col'>
            <span>Persistence Status: { persistenceStatus?.toString() }</span>
            <span>Last Persistence Event: { lastPersistenceEvent }</span>
          </div>
        
      </div>

      {/* Right Side Container */}
      <div className="ml-auto mr-2 h-full flex flex-col gap-1">
        <div className="flex justify-end text-gray-300 text-xs">
          v{import.meta.env.PACKAGE_VERSION}
        </div>

        <div className="flex gap-2 font-medium grow-1 items-end">
          <button
            type="button"
            onClick={() => setActiveTabId(TabId.Transcript)}
            className={activeTabId === TabId.Transcript ? activeTabClasses : otherTabClasses}
            style={activeTabId === TabId.Transcript ? { boxShadow: '2px 2px 6px rgba(0,0,0,.5)' } : {}}
          >
            Transcript
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTabId(TabId.Structures)}
            className={activeTabId === TabId.Structures ? activeTabClasses : otherTabClasses}
            style={activeTabId === TabId.Structures ? { boxShadow: '2px 2px 6px rgba(0,0,0,.5)' } : {}}
          >
            Poetic Structures ({ psCount })
          </button>
          
        </div>
      </div>

    </div>
  );
};

export { ControlBar };
