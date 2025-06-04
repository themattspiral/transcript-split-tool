import { CSSProperties, useCallback } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faX, faTrash, faCaretDown } from '@fortawesome/free-solid-svg-icons';

import { getPhraseText, Phrase, PoeticStructureRelationshipType, SpanType, TypeOfPoeticStructure } from '../shared/data';
import { useUserData } from '../context/user-data-context';
import { EditState, useStructureEdit } from '../context/structure-edit-context';
import { SimpleSpanBubble } from '../shared/components/simple-span-bubble';
import { Badge } from '../shared/components/badge';

interface StructureBuilderProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

const CONTAINER_CLASSES = 'pl-3 pr-4 pt-6 pb-6 flex flex-col justify-center items-center overflow-x-hidden overflow-y-auto';

export const StructureBuilder: React.FC<StructureBuilderProps> = ({ className, style }) => {
  const { transcriptLines, poeticStructures, topsMap } = useUserData();
  const {
    editState, pendingRepetition, pendingSource, pendingTops, editingStructureId,
    clearAllPending, createNewStructureFromPending, savePendingStructureEdit,
    deleteStructureUnderEdit
  } = useStructureEdit();

  const handleConfirm = useCallback(() => {
    if (editState === EditState.EditingExisting) {
      savePendingStructureEdit();
    } else {
      createNewStructureFromPending();
    }
  }, [editState, createNewStructureFromPending, savePendingStructureEdit]);
  
  const isSameLine = pendingRepetition?.lineNumber === pendingSource?.lineNumber;
  const hasOrderingError = pendingRepetition && pendingSource && (
    pendingSource.lineNumber > pendingRepetition.lineNumber
    || (isSameLine && pendingRepetition.start < pendingSource.end)
  );
  
  let repetitionPhraseToShow: Phrase | null = null;
  let sourcePhraseToShow: Phrase | null = null;
  let topsToShow: TypeOfPoeticStructure | null = null;
  let repetitionModified = false;
  let sourceModified = false;
  let topsModified = false;
  
  if (editState === EditState.CreatingNew) {
    repetitionPhraseToShow = pendingRepetition;
    sourcePhraseToShow = pendingSource;
    topsToShow = pendingTops;
  } else if (editState === EditState.EditingExisting && editingStructureId) {
    const structure = poeticStructures[editingStructureId]

    if (pendingRepetition) {
      repetitionPhraseToShow = pendingRepetition;
      repetitionModified = true;
    } else {
      repetitionPhraseToShow = structure.repetition;
    }

    if (pendingSource) {
      sourcePhraseToShow = pendingSource;
      sourceModified = true;
    } else {
      sourcePhraseToShow = structure.sources[0];
    }

    if (pendingTops) {
      topsToShow = pendingTops;
      topsModified = true;
    } else {
      topsToShow = topsMap[structure.topsId];
    }
  }
  
  const repetitionText = getPhraseText(repetitionPhraseToShow, transcriptLines) || '<selection pending>';
  const sourceText = getPhraseText(sourcePhraseToShow, transcriptLines) || '<selection pending>';
  
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

      {/* top content container */}
      <section className="shrink-0 w-full h-fit flex flex-col items-center justify-center mb-2">
        { editState === EditState.CreatingNew && 'New Structure' }
        { editState === EditState.EditingExisting && 'Editing Structure' }
      </section>

      {/* middle content container */}
      <section className="grow-1 w-full flex flex-col justify-center">

        {/* error message */}
        <div className="flex items-center justify-center mb-4" style={{ visibility: hasOrderingError ? 'visible' : 'hidden' }}>
          <div className="text-center text-red-500 font-bold text-sm bg-red-100 rounded-xl py-1 px-6 border-1 border-red-300">
            Repetition must come after Source.
          </div>
        </div>
        
        <h2 className="w-full text-gray-600 text-md font-bold flex items-center">
          <span className="mr-4">ToPS:</span>
          <span className="grow-1 flex items-center justify-end">
            <Badge size="large">{topsToShow?.displayName}</Badge>
            <FontAwesomeIcon icon={faCaretDown} size="sm" className="ml-2" />
          </span>
        </h2>
        <div
          className="w-full flex justify-end text-red-500 text-xs font-semibold mt-1 mb-4"
          style={{ visibility: topsModified ? 'visible' : 'hidden' }}
        >
          Modified
        </div>

        <h2 className="w-full text-gray-600 text-md font-bold mb-2">
          Repetition:
        </h2>

        <div className="flex items-center w-full">
          <Badge mode="line-number" size="large" className="shrink-0">
            { repetitionPhraseToShow?.lineNumber || '--' }
          </Badge>
          
          <SimpleSpanBubble
            spanType={SpanType.Repetition}
            mode='general'
            className="block font-semibold border-2 border-gray-600 border-dashed grow-1 text-center"
            style={{ padding: '10px 20px', color: !repetitionPhraseToShow ? 'gray' : undefined }}
            showDeemphasized={!repetitionPhraseToShow}
          >
            { repetitionText }
          </SimpleSpanBubble>
        </div>

        <div
          className="w-full flex justify-end text-red-500 text-xs font-semibold mt-1 mb-4"
          style={{ visibility: repetitionModified ? 'visible' : 'hidden' }}
        >
          Modified
        </div>
    
        { topsToShow?.relationshipType !== PoeticStructureRelationshipType.Unary &&
          <>
          <h2 className="w-full text-gray-600 text-md font-bold mb-2">
            Source{topsToShow?.relationshipType === PoeticStructureRelationshipType.MultipleSource ? 's' : ''}:
          </h2>

          <div className="flex items-center w-full">
            <Badge mode="line-number" size="large" className="shrink-0">
              { sourcePhraseToShow?.lineNumber || '--' }
            </Badge>

            <SimpleSpanBubble
              spanType={SpanType.Source}
              mode='general'
              className="block font-semibold border-2 border-gray-600 border-dashed grow-1 text-center"
              style={{ padding: '10px 20px', color: !sourcePhraseToShow ? 'gray' : undefined }}
              showDeemphasized={!sourcePhraseToShow}
              >
              { sourceText }
            </SimpleSpanBubble>
          </div>

          <div
            className="w-full flex justify-end text-red-500 text-xs font-semibold mt-1"
            style={{ visibility: sourceModified ? 'visible' : 'hidden' }}
          >
            Modified
          </div>
          </>
        }

      </section>

      {/* bottom button container */}
      <section className="shrink-0 flex flex-col gap-2 min-w-[50px] max-w-[320px] w-full mt-10">

        <button
          disabled={!submitEnabled}
          className={classNames(
            'w-full h-[35px] rounded-lg text-white',
            submitEnabled ? 'bg-green-500 hover:bg-green-600 hover:text-green-100 cursor-pointer shadow-md shadow-gray-400' : 'bg-gray-300 cursor-not-allowed'
          )}
          onClick={handleConfirm}
        >
          <FontAwesomeIcon icon={faCheck} size="xl" />
          <span className="font-semibold ml-2">Save {editState === EditState.EditingExisting ? 'Changes' : 'New'}</span>
        </button>

        <button
          className="w-full h-[35px] rounded-lg bg-gray-500 hover:bg-gray-600 text-white hover:text-gray-100 cursor-pointer shadow-md shadow-gray-400"
          onClick={clearAllPending}
        >
          <FontAwesomeIcon icon={faX} size="lg" />
          <span className="font-semibold ml-2">{editState === EditState.EditingExisting ? 'Discard Changes' : 'Cancel'}</span>
        </button>

        { editState === EditState.EditingExisting &&
          <button
            className="w-full h-[35px] rounded-lg bg-red-500 hover:bg-red-600 text-white hover:text-red-100 cursor-pointer shadow-md shadow-gray-400 mt-2"
            onClick={() => deleteStructureUnderEdit() }
          >
            <FontAwesomeIcon icon={faTrash} size="lg" />
            <span className="font-semibold ml-2">Delete</span>
          </button>
        }

      </section>

    </div>
  );
};
