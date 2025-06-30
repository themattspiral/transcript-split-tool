import { CSSProperties, useMemo } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faX, faTrash, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

import { getPhraseText, PoeticStructureRelationshipType, SpanType } from '../../shared/data';
import { useProjectData } from '../../context/project-data-context';
import { useViewState } from '../../context/view-state-context';
import { EditState, useStructureEdit } from '../../context/structure-edit-context';
import { SimpleSpanBubble } from '../../shared/components/simple-span-bubble';
import { Badge } from '../../shared/components/badge';
import { Dropdown } from '../../shared/components/dropdown';
import { ManyToOneIcon } from '../../shared/components/many-to-one-icon';
import { CONFIRM_DELETE } from '../../modal/modal-messages';

const PENDING_TEXT = '<selection pending>';
const CONTAINER_CLASSES = 'pl-5 pr-6 pt-6 pb-6 flex flex-col justify-center items-center overflow-x-hidden overflow-y-auto';

interface StructureBuilderProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export const StructureBuilder: React.FC<StructureBuilderProps> = ({ className, style }) => {
  const { confirmModal } = useViewState();
  const { transcriptLines, topsMap } = useProjectData();
  const {
    editState, editInfo, editValidity, removeSourceFromStructureUnderEdit,
    clearAllPending, savePendingStructureEdit, deleteStructureUnderEdit, setPendingTops
  } = useStructureEdit();

  const topsDropdownOptions = useMemo(() => {
    return Object.values(topsMap).map(t => ({
      id: t.type.id,
      selectable: t.type.selectable,
      level: t.level,
      textLabel: t.type.hierarchyDisplayName || t.type.displayName,
      label: (
        <div className="flex items-center">
          <span>{ t.type.displayName }</span>
          { t.type.relationshipType === PoeticStructureRelationshipType.MultipleSource &&
            <ManyToOneIcon className="ml-4" />
          }
        </div>
      )
    }));
  }, [topsMap]);
  
  const repetitionText = getPhraseText(editInfo.repetitionToShow, transcriptLines) || PENDING_TEXT;
  
  let submitEnabled = editValidity.isCompleteStructure && !editValidity.hasOrderingError;
  if (editState === EditState.EditingExisting) {
    submitEnabled &&= editInfo.anyModified;
  }

  const isUnary = editInfo.topsToShow?.relationshipType === PoeticStructureRelationshipType.Unary;
  const isMultiSource = editInfo.topsToShow?.relationshipType === PoeticStructureRelationshipType.MultipleSource;

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
      <section className="grow-1 w-full flex flex-col">

        <div className="grow-1 shrink-2"></div>
        
        {/* ToPS */}
        <div>
          <h2 className="w-full text-gray-600 text-md font-bold flex items-center">
            <span className="mr-4">ToPS:</span>
            <div className="grow-1 flex justify-end">
              <Dropdown
                options={topsDropdownOptions}
                selectedId={editInfo.topsToShow?.id || ''}
                onChange={(id: string) => setPendingTops(topsMap[id].type)}
              />
            </div>
          </h2>
          <div
            className="w-full flex justify-end text-red-500 text-xs font-semibold mt-1"
            style={{ visibility: editInfo.topsModified ? 'visible' : 'hidden' }}
          >
            Modified
          </div>
        </div>

        <div className="max-h-6 grow-1 shrink-1"></div>

        {/* Sources */}
        { !isUnary &&
          <div>
            <h2 className="w-full text-gray-600 text-md font-bold mb-2">
              Source{isMultiSource ? 's' : ''}:
            </h2>
            
            {/* Source Pending */}
            { (!editInfo.sourcesToShow || editInfo.sourcesToShow?.length === 0) &&
              <div className="flex items-center w-full">
                <Badge mode="line-number" size="large" className="shrink-0">
                  --
                </Badge>

                <SimpleSpanBubble
                  spanType={SpanType.Source}
                  mode="general"
                  className="block font-semibold border-2 border-gray-600 border-dashed grow-1 text-center"
                  style={{ padding: '10px 20px', color: 'gray' }}
                  showDeemphasized={true}
                >
                  { PENDING_TEXT }
                </SimpleSpanBubble>
              </div>
            }
            
            {/* All Sources */}
            <div className="flex flex-wrap gap-y-2 gap-x-4">
              { editInfo.sourcesToShow?.map((source, idx) => {
                return !isMultiSource && idx > 0 ? null : (
                  <div key={source.id} className={classNames('flex items-center relative', { ['w-full']: !isMultiSource })}>
                    <Badge mode="line-number" size="large" className="shrink-0">
                      { source.lineNumber }
                    </Badge>

                    <SimpleSpanBubble
                      spanType={SpanType.Source}
                      mode="general"
                      className="block font-semibold border-2 border-gray-600 border-dashed grow-1 text-center"
                      style={{ padding: isMultiSource ? '5px 10px' : '10px 20px' }}
                      showEmphasized={true}
                      >
                      { getPhraseText(source, transcriptLines) }
                    </SimpleSpanBubble>

                    { isMultiSource &&
                      <button
                        type="button"
                        className="self-start w-[20px] text-red-500 hover:text-red-600 cursor-pointer absolute top-[-10px] right-[-10px]"
                        onClick={() => removeSourceFromStructureUnderEdit(source.id)}
                      >
                        <FontAwesomeIcon icon={faCircleXmark} size="lg" />
                      </button>
                    }
                  </div>
                );
              }) }
            </div>
            <div
              className="w-full flex justify-end text-red-500 text-xs font-semibold mt-1"
              style={{ visibility: editInfo.sourcesModified ? 'visible' : 'hidden' }}
            >
              Modified
            </div>
          </div>
        }
        
        <div className="max-h-6 grow-1 shrink-1"></div>

        {/* Repetition */}
        <div>
          <h2 className="w-full text-gray-600 text-md font-bold mb-2">
            Repetition:
          </h2>

          <div className="flex items-center w-full">
            <Badge mode="line-number" size="large" className="shrink-0">
              { editInfo.repetitionToShow?.lineNumber || '--' }
            </Badge>
            
            <SimpleSpanBubble
              spanType={SpanType.Repetition}
              mode="general"
              className="block font-semibold border-2 border-gray-600 border-dashed grow-1 text-center"
              style={{ padding: '10px 20px', color: !editInfo.repetitionToShow ? 'gray' : undefined }}
              showEmphasized={!!editInfo.repetitionToShow}
              showDeemphasized={!editInfo.repetitionToShow}
            >
              { repetitionText }
            </SimpleSpanBubble>
          </div>

          <div
            className="w-full flex justify-end text-red-500 text-xs font-semibold mt-1"
            style={{ visibility: editInfo.repetitionModified ? 'visible' : 'hidden' }}
          >
            Modified
          </div>
        </div>

        <div className="grow-2 shrink-1"></div>

      </section>

      {/* error message */}
      <section
        className="flex items-center justify-center mt-2 mb-2 w-full"
        style={editValidity.hasOrderingError ? undefined : { display: 'none' }}
      >
        <div className="text-center text-red-500 font-bold text-sm bg-red-100 rounded-xl py-1 px-6 border-1 border-red-300 w-full">
          { isMultiSource ? 'All sources' : 'Source' } must come before Repetition
        </div>
      </section>

      {/* bottom button container */}
      <section className="shrink-0 flex flex-col gap-2 min-w-[50px] max-w-[200px] w-full mt-2">

        <button
          type="button"
          disabled={!submitEnabled}
          className={classNames(
            'w-full h-[35px] rounded-lg text-white',
            submitEnabled ? 'bg-green-500 hover:bg-green-600 hover:text-green-100 cursor-pointer shadow-md shadow-gray-400' : 'bg-gray-300 cursor-not-allowed'
          )}
          onClick={savePendingStructureEdit}
        >
          <FontAwesomeIcon icon={faCheck} size="xl" />
          <span className="font-semibold ml-2">{editState === EditState.EditingExisting ? 'Save' : 'Create'}</span>
        </button>

        <button
          type="button"
          className="w-full h-[35px] rounded-lg bg-gray-400 hover:bg-gray-500 text-white hover:text-gray-100 cursor-pointer shadow-md shadow-gray-400"
          onClick={clearAllPending}
        >
          <FontAwesomeIcon icon={faX} size="lg" />
          <span className="font-semibold ml-2">Cancel</span>
        </button>

        { editState === EditState.EditingExisting &&
          <button
            type="button"
            className="w-full h-[35px] rounded-lg bg-red-500 hover:bg-red-600 text-white hover:text-red-100 cursor-pointer shadow-md shadow-gray-400 mt-2"
            onClick={() => {
              confirmModal(CONFIRM_DELETE).then(() => deleteStructureUnderEdit).catch(() => {});
            }}
          >
            <FontAwesomeIcon icon={faTrash} size="lg" />
            <span className="font-semibold ml-2">Delete</span>
          </button>
        }

      </section>

    </div>
  );
};
