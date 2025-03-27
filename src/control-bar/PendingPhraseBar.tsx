import classnames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faX } from "@fortawesome/free-solid-svg-icons";

import { useViewState } from "../ViewStateContext";
import { getPhraseLineNumber, getPhraseText } from '../util/util';

const PendingPhraseBar: React.FC = () => {
  const {
    transcriptLines, pendingPhrase, pendingRepeatedPhrase,
    clearPendingPhrases, addPendingPhrasesToRepetitions
  } = useViewState();

  if (!pendingPhrase && !pendingRepeatedPhrase) {
    return null;
  }

  const phraseText = getPhraseText(pendingPhrase, transcriptLines) || '<selection pending>';
  const repetitionOfText = getPhraseText(pendingRepeatedPhrase, transcriptLines) || '<selection pending>';
  
  const isSameLine = pendingPhrase?.transcriptLineIdx === pendingRepeatedPhrase?.transcriptLineIdx;
  const hasOrderingError = pendingPhrase && pendingRepeatedPhrase && (
    pendingRepeatedPhrase.transcriptLineIdx > pendingPhrase.transcriptLineIdx
    || (isSameLine && pendingPhrase.start < pendingRepeatedPhrase.end)
  );
  const submitEnabled = pendingPhrase && pendingRepeatedPhrase && !hasOrderingError;
  
  return (
    <div className="flex flex-col py-4 px-4 mt-4 mr-4 mb-3 ml-6 bg-blue-50 border-blue-300 border-2 rounded-lg overflow-hidden">
      
      <div className="flex items-center w-full">
        <div className="text-nowrap font-medium text-lg mb-[1px]">Phrase:</div>
        <div className="text-nowrap px-2">Line { getPhraseLineNumber(pendingPhrase, transcriptLines) }</div>
        <div className="grow-1 shrink-1 basis-[50%] font-mono px-2">
          <div className={classnames(
            'inline-block rounded-xl px-2 py-1 whitespace-pre-wrap border-2 border-dashed border-orange-400 font-semibold',
            pendingPhrase ? 'bg-orange-200' : 'bg-yellow-200'
          )}>
            { phraseText }
          </div>
        </div>
        
        <div className="text-nowrap font-medium text-lg ml-2 mb-[1px]">Repeats:</div>
        <div className="text-nowrap px-2">Line { getPhraseLineNumber(pendingRepeatedPhrase, transcriptLines) || '--' }</div>
        <div className="grow-1 shrink-1 basis-[50%] font-mono px-2">
          <div className={classnames(
            'inline-block rounded-xl px-2 py-1 whitespace-pre-wrap border-2 border-dashed border-blue-400 font-semibold',
            pendingRepeatedPhrase ? 'bg-blue-200' : 'bg-yellow-200'
          )}>
            { repetitionOfText }
          </div>
        </div>

        <button
          className="basis-[35px] shrink-0 w-[35px] h-[35px] rounded-lg bg-gray-500 hover:bg-gray-600 cursor-pointer shadow-md shadow-gray-400 ml-2"
          onClick={clearPendingPhrases}
        >
          <FontAwesomeIcon icon={faX} size="lg" className="cancel-button text-white" />
        </button>
        
        <button
          disabled={!submitEnabled}
          className={classnames(
            'basis-[35px] shrink-0 w-[35px] h-[35px] rounded-lg ml-1',
            submitEnabled ? 'bg-green-500 hover:bg-green-600 cursor-pointer shadow-md shadow-gray-400' : 'bg-gray-300 cursor-not-allowed'
          )}
          onClick={addPendingPhrasesToRepetitions}
        >
          <FontAwesomeIcon icon={faCheck} size="xl" className="confirm-button text-white" />
        </button>
      </div>

      { hasOrderingError &&
        <div className="flex items-center justify-center mt-4">
          <div className="text-red-500 font-bold text-sm bg-red-100 rounded-xl py-1 px-6 border-1 border-red-300">
            Phrase must come after repeated phrase.
          </div>
        </div>
      }
      
    </div>
  );
};

export { PendingPhraseBar };
