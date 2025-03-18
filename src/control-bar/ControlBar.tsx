import { useRef } from 'react';
import { extractRawText } from 'mammoth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWord, faFileExcel } from "@fortawesome/free-regular-svg-icons";

import { TranscriptLine, TABS } from '../data';
import { useViewState } from '../ViewStateContext';

const AUTHOR_RE = new RegExp(/^[a-zA-Z]{1,20}:\s/);

interface ControlBarProps {
  transcriptLines: TranscriptLine[];
  onTranscriptUploaded: (lines: TranscriptLine[]) => void;
}

const ControlBar: React.FC<ControlBarProps> = props => {
  const { transcriptLines, onTranscriptUploaded } = props;
  const { activeTabId, setActiveTabId } = useViewState();

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
            lineNumber: (idx + 1).toString(),
            text: line,
            parts: []
          };

          // split out author
          const matches = AUTHOR_RE.exec(line);
          if (matches?.length) {
            const speaker: string = matches[0];

            // remove final ": " for speaker 
            tl.speaker = speaker.substring(0, speaker.length - 2);
            tl.textWithoutSpeaker = line.substring(speaker.length);
          }

          return tl;
        });

        onTranscriptUploaded(lines);

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

  const activeTabClasses = "bg-gray-300 px-3 pt-1 pb-2 rounded-t-lg shadow-[1px 2px 4px rgba(0,0,0,.5)]";
  const otherTabClasses = "bg-gray-200 hover:bg-gray-300 px-3 pt-1 pb-2 rounded-t-lg cursor-pointer";
  
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
      <div className="mb-2 flex gap-2">
        <button
          onClick={() => {
            fileInputRef.current?.click();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer flex items-center"
        >
          Import New Transcript
          <FontAwesomeIcon icon={faFileWord} className="ml-2" size="lg" />
        </button>

        <button
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
      </div>

      {/* Right Side Container */}
      <div className="ml-auto mr-2 flex gap-2 font-medium">
        <button
          onClick={() => setActiveTabId(TABS.Transcript)}
          className={activeTabId === TABS.Transcript ? activeTabClasses : otherTabClasses}
          style={activeTabId === TABS.Transcript ? { boxShadow: '2px 2px 6px rgba(0,0,0,.5)' } : {}}
        >
          Transcript
        </button>
        
        <button
          onClick={() => setActiveTabId(TABS.PhraseBook)}
          className={activeTabId === TABS.PhraseBook ? activeTabClasses : otherTabClasses}
          style={activeTabId === TABS.PhraseBook ? { boxShadow: '2px 2px 6px rgba(0,0,0,.5)' } : {}}
        >
          Phrase Book
        </button>
        
        <button
          onClick={() => setActiveTabId(TABS.Poems)}
          className={activeTabId === TABS.Poems ? activeTabClasses : otherTabClasses}
          style={activeTabId === TABS.Poems ? { boxShadow: '2px 2px 6px rgba(0,0,0,.5)' } : {}}
        >
          Poems
        </button>
      </div>

    </div>
  );
};

export { ControlBar };
