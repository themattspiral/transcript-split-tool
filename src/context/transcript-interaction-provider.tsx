import { useCallback, useEffect, useMemo, useState } from 'react';
import { useContextMenu } from 'react-contexify';

import { TranscriptInteractionContext } from './transcript-interaction-context';
import { MenuAction, Phrase, PhraseAction, PhraseRole, PhraseViewState } from '../shared/data';
import { useUserData } from './user-data-context';
import { EditState, useStructureEdit } from './structure-edit-context';
import { TranscriptMenuId } from '../transcript-view/menus/transcript-menus';

interface TranscriptHoverState {
  phraseIds: string[];
  menuStructureId: string | null;
}

export const TranscriptInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { phraseLinks, getAllLinkedPhraseIds, getAllStructurePhraseIds } = useUserData();
  const { editState, editInfo, setPendingPhrase, beginStructureEdit } = useStructureEdit();
  const { show: showContextMenu } = useContextMenu();

  // phrase ids associated with right-clicked span (all phrases associated via current poetic structures)
  const [contextPhraseIds, setContextPhraseIds] = useState<string[]>([]);

  // highlighted phrase when it is right-clicked
  const [highlightedPhrase, setHighlightedPhrase] = useState<Phrase | null>(null);
  
  // user interactions are tracked here and used to calculate phraseViewStates
  const [hoverState, setHoverState] = useState<TranscriptHoverState>({
    phraseIds: [],
    menuStructureId: null
  });
  
  const [transcriptMenuVisibility, setTranscriptMenuVisibility] = useState<{ [key in TranscriptMenuId]: boolean }>({
    [TranscriptMenuId.StructureSelectMenu]: false,
    [TranscriptMenuId.HighlightMenu]: false,
    [TranscriptMenuId.ErrorMultipleLinesMenu]: false
  });

  const allTranscriptMenusClosed: boolean = useMemo(() => {
    return Object.values(transcriptMenuVisibility).every(m => m === false);
  }, [transcriptMenuVisibility]);

  // TODO - remove when done with menu dev
  const [lme, setLme] = useState<React.MouseEvent | null>(null);

  // view states represent a modification to the way a standard phrase's span buuble is styled,
  // because something is hovered, which changes emphasis
  const phraseViewStates: { [phraseId: string]: PhraseViewState } = useMemo(() => {
    const pvs: { [phraseId: string]: PhraseViewState } = {};
    
    let phraseIdsToEmphasize: string[] = [];

    if (editState === EditState.Idle) {
      if (hoverState.menuStructureId) {
        phraseIdsToEmphasize =  getAllStructurePhraseIds(hoverState.menuStructureId);
      } else if (hoverState.phraseIds.length > 0) {
        phraseIdsToEmphasize = getAllLinkedPhraseIds(hoverState.phraseIds);
      }
    } else {
      if (editInfo.repetitionToShow) {
        phraseIdsToEmphasize.push(editInfo.repetitionToShow.id);
      }
      if (editInfo.sourceToShow) {
        phraseIdsToEmphasize.push(editInfo.sourceToShow.id);
      }
    }

    const phraseIdMap = {} as { [phraseId: string]: boolean };
    phraseIdsToEmphasize.forEach(id => phraseIdMap[id] = true);
    
    Object.keys(phraseLinks).forEach((phraseId: string) => {
      const inMap = phraseIdMap[phraseId] || false;

      pvs[phraseId] = { isDeemphasized: !inMap && phraseIdsToEmphasize.length > 0, isEmphasized: inMap };
    });

    return pvs;
  }, [editState, editInfo, phraseLinks, hoverState, getAllLinkedPhraseIds, getAllStructurePhraseIds]);

  const handlePhraseAction = useCallback((event: React.MouseEvent, phraseIds: string[], action: PhraseAction) => {
    if (editState !== EditState.Idle) {
      return;
    }

    switch (action) {
      case PhraseAction.Hover:
        if (allTranscriptMenusClosed) {
          setHoverState({ phraseIds, menuStructureId: null });
        }
        break;
      case PhraseAction.Unhover:
        if (allTranscriptMenusClosed) {
          setHoverState({ phraseIds: [], menuStructureId: null });
        }
        break;
      case PhraseAction.Context:
        setContextPhraseIds(phraseIds);
        showContextMenu({ event, id: TranscriptMenuId.StructureSelectMenu });

        // hovered ids are set so that all the spans related to this menu stay emphasized
        // while it's open (unless hovering on something specific inside the menu)
        setHoverState({ phraseIds, menuStructureId: null });

        // TODO - remove when no longer needed
        setLme(event);
        break;
      case PhraseAction.Click:
      default:
        break;
    }
  }, [allTranscriptMenusClosed, editState, setHoverState, setContextPhraseIds, showContextMenu]);

  const handleStructureSelectMenuAction = useCallback((structureOrPhraseId: string, action: MenuAction) => {
    if (editState !== EditState.Idle) {
      return;
    }

    switch (action) {
      case MenuAction.Click:
        // note: hover states are cleared by an effect automatically when the menu closes
        //       (after clicking something in it)
        beginStructureEdit(structureOrPhraseId);
        break;
      case MenuAction.HoverStructure:
        setHoverState({ phraseIds: [], menuStructureId: structureOrPhraseId });
        break;
      case MenuAction.Unhover:
        setHoverState({ phraseIds: contextPhraseIds, menuStructureId: null });
        break;
    }
  }, [
    editState, contextPhraseIds,
    setHoverState, setContextPhraseIds, beginStructureEdit, getAllStructurePhraseIds
  ]);

  const updateMenuVisibility = useCallback((menuId: TranscriptMenuId, isVisible: boolean) => {
    setTranscriptMenuVisibility(vis => ({
      ...vis,
      [menuId]: isVisible
    }));
  }, [setTranscriptMenuVisibility]);

  const makeHighlightedPhrasePending = useCallback((role: PhraseRole) => {
    setPendingPhrase(highlightedPhrase, role);
    setHighlightedPhrase(null);
  }, [highlightedPhrase, setPendingPhrase, setHighlightedPhrase]);

  // when all menus are closed
  useEffect(() => {
    if (allTranscriptMenusClosed) {
      // clear all the possible hovered menu items because onMouseOut won't fire when menu closes
      setHoverState({ phraseIds: [], menuStructureId: null });

      // clear context phrase ids for good housekeeping (no context ids should be set when menus are closed)
      //
      //   ** note ** - timing issues with react-contexify occur if this is done in
      //                the event handler invoked when a menu item is clicked (handleStructureSelectMenuAction)
      setContextPhraseIds([]);

      // TODO remove after done debugging
      // uncomment to keep menu open
      // if (lme) {
      //   showContextMenu({ event: lme, id: TranscriptMenuId.StructureSelectMenu });
      // }
    }
  }, [allTranscriptMenusClosed, setHoverState, setContextPhraseIds, lme]);

  const value = useMemo(() => ({
    phraseViewStates, handlePhraseAction, handleStructureSelectMenuAction, updateMenuVisibility,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending
  }), [
    phraseViewStates, handlePhraseAction, handleStructureSelectMenuAction, updateMenuVisibility,
    contextPhraseIds, highlightedPhrase, setHighlightedPhrase, makeHighlightedPhrasePending
  ]);

  return (
    <TranscriptInteractionContext.Provider value={value}>
      { children }
    </TranscriptInteractionContext.Provider>
  );
};
