import { CSSProperties, useCallback } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faX, faArrowsRotate, faTrash } from '@fortawesome/free-solid-svg-icons';

import { getPhraseText, SpanType } from '../shared/data';
import { useUserData } from '../context/user-data-context';
import { EditState, useStructureEdit } from '../context/structure-edit-context';
import { SimpleSpanBubble } from '../shared/components/simple-span-bubble';
import { Badge } from '../shared/components/badge';

interface StructureBuilderProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

const CONTAINER_CLASSES = 'p-2 flex flex-col justify-center items-center overflow-hidden';

export const StructureBuilder: React.FC<StructureBuilderProps> = ({ className, style }) => {
  const { transcriptLines } = useUserData();
  const {
    editState, pendingRepetition, pendingSource, clearAllPending,
    createNewStructureFromPendingPhrases, savePendingStructureEdit,
    deleteStructureUnderEdit
  } = useStructureEdit();

  const handleConfirm = useCallback(() => {
    if (editState === EditState.EditingExisting) {
      savePendingStructureEdit();
    } else {
      createNewStructureFromPendingPhrases();
    }
  }, [editState, createNewStructureFromPendingPhrases, savePendingStructureEdit]);

  const repetitionText = getPhraseText(pendingRepetition, transcriptLines) || '<selection pending>';
  const sourceText = getPhraseText(pendingSource, transcriptLines) || '<selection pending>';
  
  const isSameLine = pendingRepetition?.lineNumber === pendingSource?.lineNumber;
  const hasOrderingError = pendingRepetition && pendingSource && (
    pendingSource.lineNumber > pendingRepetition.lineNumber
    || (isSameLine && pendingRepetition.start < pendingSource.end)
  );
  const submitEnabled = pendingRepetition && pendingSource && !hasOrderingError;

  return editState === EditState.Idle ? (

    <div className={classNames(CONTAINER_CLASSES, 'text-gray-400 p-6', className)} style={style}>

      <div className="mb-16">
        Highlight transcript text and right-click to begin defining a new Poetic Structure.
      </div>
      <div>
        Right-click on a phrase bubble to edit an existing Poetic Structure.
      </div>

    </div>
  ) : (
    <div className={classNames(CONTAINER_CLASSES, className)} style={style}>
      
      <div className="flex items-center mb-10">
        <Badge mode="line-number" size="large">
          { pendingRepetition?.lineNumber }
        </Badge>
        
        <SimpleSpanBubble
          spanType={SpanType.Repetition}
          mode='general'
          className="block font-semibold border-2 border-gray-600 border-dashed"
          style={{ padding: '10px 20px' }}
        >
          { repetitionText }
        </SimpleSpanBubble>
      </div>
  
      <div className="flex items-center mb-16">
        <Badge mode="line-number" size="large">
          { pendingSource?.lineNumber }
        </Badge>

        <SimpleSpanBubble
          spanType={SpanType.Source}
          mode='general'
          className="block font-semibold border-2 border-gray-600 border-dashed"
          style={{ padding: '10px 20px' }}
          >
          { sourceText }
        </SimpleSpanBubble>
      </div>

      {/* button container */}
      <div className="flex gap-2">

        { editState === EditState.EditingExisting &&
          <button
            className="w-[35px] h-[35px] rounded-lg bg-red-500 hover:bg-red-600 text-white hover:text-red-100 cursor-pointer shadow-md shadow-gray-400"
            onClick={() => deleteStructureUnderEdit() }
          >
            <FontAwesomeIcon icon={faTrash} size="lg" className="delete-button" />
          </button>
        } 

        <button
          className="w-[35px] h-[35px] rounded-lg bg-gray-500 hover:bg-gray-600 text-white hover:text-gray-100 cursor-pointer shadow-md shadow-gray-400"
          onClick={clearAllPending}
        >
          <FontAwesomeIcon icon={faX} size="lg" className="cancel-button" />
        </button>
        
        <button
          disabled={!submitEnabled}
          className={classNames(
            'w-[35px] h-[35px] rounded-lg text-white',
            submitEnabled ? 'bg-green-500 hover:bg-green-600 hover:text-green-100 cursor-pointer shadow-md shadow-gray-400' : 'bg-gray-300 cursor-not-allowed'
          )}
          onClick={handleConfirm}
        >
          <FontAwesomeIcon icon={editState === EditState.EditingExisting ? faArrowsRotate : faCheck} size="xl" className="confirm-button" />
        </button>
      </div>

      { hasOrderingError &&
        <div className="flex items-center justify-center mt-4">
          <div className="text-red-500 font-bold text-sm bg-red-100 rounded-xl py-1 px-6 border-1 border-red-300">
            Repetition must come after Source.
          </div>
        </div>
      }

    </div>
  );
};
