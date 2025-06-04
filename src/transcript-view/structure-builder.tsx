import { CSSProperties, useCallback } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faX, faTrash, faCaretDown } from '@fortawesome/free-solid-svg-icons';

import { getPhraseText, PoeticStructureRelationshipType, SpanType } from '../shared/data';
import { useUserData } from '../context/user-data-context';
import { EditState, useStructureEdit } from '../context/structure-edit-context';
import { SimpleSpanBubble } from '../shared/components/simple-span-bubble';
import { Badge } from '../shared/components/badge';

interface StructureBuilderProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

const CONTAINER_CLASSES = 'pl-3 pr-4 pt-3 pb-3 flex flex-col justify-center items-center overflow-x-hidden overflow-y-auto';

export const StructureBuilder: React.FC<StructureBuilderProps> = ({ className, style }) => {
  const { transcriptLines } = useUserData();
  const {
    editState, pendingRepetition, pendingSource, pendingTops, clearAllPending,
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

      <div className="mb-16 max-w-[320px] text-center">
        Highlight transcript text and right-click to begin defining a new Poetic Structure.
      </div>
      <div className="max-w-[320px] text-center">
        Right-click on a phrase bubble to edit an existing Poetic Structure.
      </div>

    </div>
  ) : (
    <div className={classNames(CONTAINER_CLASSES, className)} style={style}>

      <div className="flex items-center justify-center mb-4" style={{ visibility: hasOrderingError ? 'visible' : 'hidden' }}>
        <div className="text-center text-red-500 font-bold text-sm bg-red-100 rounded-xl py-1 px-6 border-1 border-red-300">
          Repetition must come after Source.
        </div>
      </div>
      
      <div className="w-full text-gray-600 text-md font-bold flex items-center mb-4">
        <span className="mr-4">ToPS:</span>
        <span className="grow-1 flex items-center justify-end">
          <Badge size="large">{pendingTops?.displayName}</Badge>
          <FontAwesomeIcon icon={faCaretDown} size="sm" className="ml-2" />
        </span>
      </div>

      <h2 className="w-full text-gray-600 text-md font-bold mb-2">
        Repetition:
      </h2>

      <div className="flex items-center w-full mb-4">
        <Badge mode="line-number" size="large" className="shrink-0">
          { pendingRepetition?.lineNumber }
        </Badge>
        
        <SimpleSpanBubble
          spanType={SpanType.Repetition}
          mode='general'
          className="block font-semibold border-2 border-gray-600 border-dashed grow-1 text-center"
          style={{ padding: '10px 20px' }}
        >
          { repetitionText }
        </SimpleSpanBubble>
      </div>
  
      { pendingTops?.relationshipType !== PoeticStructureRelationshipType.Unary &&
        <>
        <h2 className="w-full text-gray-600 text-md font-bold mb-2">
          Source{pendingTops?.relationshipType === PoeticStructureRelationshipType.MultipleSource ? 's' : ''}:
        </h2>

        <div className="flex items-center mb-16 w-full">
          <Badge mode="line-number" size="large" className="shrink-0">
            { pendingSource?.lineNumber || '--' }
          </Badge>

          <SimpleSpanBubble
            spanType={SpanType.Source}
            mode='general'
            className="block font-semibold border-2 border-gray-600 border-dashed grow-1 text-center"
            style={{ padding: '10px 20px', color: !pendingSource ? 'gray' : undefined }}
            showDeemphasized={!pendingSource}
            >
            { sourceText }
          </SimpleSpanBubble>
        </div>
        </>
      }

      {/* button container */}
      <div className="flex flex-col gap-2 min-w-[50px] max-w-[320px] w-full">

        { editState === EditState.EditingExisting &&
          <button
            className="w-full h-[35px] rounded-lg bg-red-500 hover:bg-red-600 text-white hover:text-red-100 cursor-pointer shadow-md shadow-gray-400"
            onClick={() => deleteStructureUnderEdit() }
          >
            <FontAwesomeIcon icon={faTrash} size="lg" />
            <span className="font-semibold ml-2">Delete</span>
          </button>
        } 

        <button
          className="w-full h-[35px] rounded-lg bg-gray-500 hover:bg-gray-600 text-white hover:text-gray-100 cursor-pointer shadow-md shadow-gray-400"
          onClick={clearAllPending}
        >
          <FontAwesomeIcon icon={faX} size="lg" />
          <span className="font-semibold ml-2">{editState === EditState.EditingExisting ? 'Discard Edits' : 'Cancel'}</span>
        </button>
        
        <button
          disabled={!submitEnabled}
          className={classNames(
            'w-full h-[35px] rounded-lg text-white',
            submitEnabled ? 'bg-green-500 hover:bg-green-600 hover:text-green-100 cursor-pointer shadow-md shadow-gray-400' : 'bg-gray-300 cursor-not-allowed'
          )}
          onClick={handleConfirm}
        >
          <FontAwesomeIcon icon={faCheck} size="xl" />
          <span className="font-semibold ml-2">Save {editState === EditState.EditingExisting ? 'Edits' : 'New'}</span>
        </button>
      </div>

    </div>
  );
};
