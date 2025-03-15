import { useRef } from 'react';
import { extractRawText } from 'mammoth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWord, faFileExcel } from "@fortawesome/free-regular-svg-icons";

import { TranscriptLine } from '../data';

interface ControlBarProps {
  transcriptLines: TranscriptLine[];
  onTranscriptUploaded: (lines: TranscriptLine[]) => void;
}

const ControlBar: React.FC<ControlBarProps> = ({ transcriptLines, onTranscriptUploaded }) => {
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
        .map((line, idx) => ({
          lineNumber: (idx + 1).toString(),
          text: line,
          parts: []
        }));

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
  
  return (
    <div className="mb-4 flex gap-4 items-center">

    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileUpload}
      accept=".docx"
      className="hidden"
    />
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
        transcriptLines.length > 0 
          ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
    >
      Export Grid
      <FontAwesomeIcon icon={faFileExcel}  className="ml-2" size="lg" />
    </button>

  </div>
  );
};

export { ControlBar };
