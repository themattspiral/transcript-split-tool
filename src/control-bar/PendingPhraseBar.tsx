import classnames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faX } from "@fortawesome/free-solid-svg-icons";

import { useViewState } from "../ViewStateContext";
import { getPhraseLineNumber, getPhraseText } from '../data';

const PendingPhraseBar: React.FC = () => {
  const {
    transcriptLines, pendingPhrase, pendingRepeatedPhrase,
    clearPendingPhrases, addPendingPhrasesToRepetitions
  } = useViewState();

  if (!pendingPhrase) {
    return null;
  }

  const phraseText = getPhraseText(pendingPhrase, transcriptLines);
  const repetitionOfText = getPhraseText(pendingRepeatedPhrase, transcriptLines);
  
  return (
    <div className="flex gap-1 items-center pt-3 pb-2 px-3 mt-4 mr-4 mb-3 ml-6 bg-blue-50 border-blue-300 border-2 border-dashed rounded-xl overflow-hidden">
      <div className="text-nowrap font-medium text-lg mb-[1px]">Phrase:</div>
      <div className="text-nowrap px-2">Line { getPhraseLineNumber(pendingPhrase, transcriptLines) }</div>
      <div className="grow-1 shrink-1 basis-[50%] font-mono px-2">
        <div className="inline-block rounded-xl bg-orange-300 px-2 py-1 whitespace-pre-wrap">
          { phraseText }
        </div>
      </div>
      
      <div className="text-nowrap font-medium text-lg ml-2 mb-[1px]">Repeats:</div>
      <div className="text-nowrap px-2">Line { getPhraseLineNumber(pendingRepeatedPhrase, transcriptLines) || '--' }</div>
      <div className={classnames(
        'grow-1 shrink-1 font-mono px-2 basis-[50%]'
      )}
      >
        <div className={classnames(
          "inline-block rounded-xl px-2 py-1 whitespace-pre-wrap",
          repetitionOfText ? 'bg-blue-300' : 'bg-yellow-300'
        )}>
          { repetitionOfText || '<selection pending>' }
        </div>
      </div>

      <button
        className="basis-[35px] shrink-0 w-[35px] h-[35px] rounded-lg bg-red-500 hover:bg-red-600 cursor-pointer"
        onClick={clearPendingPhrases}
      >
        <FontAwesomeIcon icon={faX} size="lg" className="cancel-button text-white" />
      </button>
      
      <button
        disabled={!repetitionOfText}
        className={classnames(
          'basis-[35px] shrink-0 w-[35px] h-[35px] rounded-lg',
          repetitionOfText ? 'bg-green-500 hover:bg-green-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
        )}
        onClick={addPendingPhrasesToRepetitions}
      >
        <FontAwesomeIcon icon={faCheck} size="xl" className="confirm-button text-white" />
      </button>
      
    </div>
  );
};

export { PendingPhraseBar };
