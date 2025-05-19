import { CSSProperties, useCallback, useMemo } from "react";
import classnames from "classnames";
import { useContextMenu } from "react-contexify";

import './HighlightableTextCell.scss';
import { Phrase, PhraseAssociation, TranscriptLine } from "../data/data";
import { getPhraseKey } from "../util/util";
import { PHRASE_EDIT_MENU_ID } from "../context-menu/PhraseEditMenu";
import { TRANSCRIPT_SELECTION_MENU_ID } from "../context-menu/TranscriptSelectionMenu";
import { useEditState } from "../context/EditStateContext";
import { useUserData } from "../context/UserDataContext";
import { usePhraseState } from "../context/PhraseStateContext";

enum TextSpanType {
  Phrase = 'phrase',
  RepeatedPhrase = 'repeated-phrase',
  OverlappingPhrases = 'overlapping-phrases',
  Text = 'text'
}

interface TextSpan {
  start: number;
  end: number;
  phraseAssociations: PhraseAssociation[];
  spanType: TextSpanType;
  isPending: boolean;
  isHoverable: boolean;
  isClickable: boolean;
  isContextable: boolean;
  isHovered: boolean;
  isClicked: boolean;
  isDeemphasized: boolean;
  displayRefCount?: number;
  classes?: string;
}

interface HighlightableTextCellProps {
  line: TranscriptLine;
  linePhraseAssociations: PhraseAssociation[];
  className?: string;
  style?: CSSProperties;
  attributes?: any;
}

const HighlightableTextCell: React.FC<HighlightableTextCellProps> = props => {
  const { line, linePhraseAssociations, className, style, attributes } = props;
  const text = line.textWithoutSpeaker || line.text;

  const { phraseLinks } = useUserData();
  const {
    pendingPhraseRepetitionEditId,
    setContextPhrase, setContextPhraseAssociations,
    pendingPhrase, pendingRepeatedPhrase, setPendingPhrase, setPendingRepeatedPhrase
  } = useEditState();
  const {
    hoveredPhraseKeys, clickedPhraseKeys, setHoveredPhraseKeys, setClickedPhraseKeys
  } = usePhraseState();
  const { show: showContextMenu } = useContextMenu();

  const isSpanClickable = useCallback((spanType: TextSpanType, pending: Phrase | null, pendingRepeated: Phrase | null): boolean => {
    let clickable = true;
    
    if (spanType === TextSpanType.Text) {
      clickable = false;
    } else if (pending && spanType !== TextSpanType.RepeatedPhrase) {
      clickable = false;
    } else if (pendingRepeated && spanType !== TextSpanType.Phrase) {
      clickable = false;
    } else if ((pending || pendingRepeated) && spanType === TextSpanType.OverlappingPhrases) {
      clickable = false;
    }

    return clickable;
  }, []);

  const isSpanContextable = useCallback((spanType: TextSpanType): boolean => {
    return spanType !== TextSpanType.Text;
  }, []);

  // flatten potential range overlaps
  const textSpans: TextSpan[] = useMemo(() => {
    const idxSpanSplitPoints = new Set<number>([0, line.text.length]);
    linePhraseAssociations?.forEach(assn => {
      idxSpanSplitPoints.add(assn.phrase.start);
      idxSpanSplitPoints.add(assn.phrase.end);
    });

    const sortedPoints = Array.from(idxSpanSplitPoints).sort((a, b) => a - b);

    // create discrete ranges between adjacent points
    const spans: TextSpan[] = [];
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const start = sortedPoints[i];
      const end = sortedPoints[i + 1];
      
      // find which original phrase associations this span covers
      const phraseAssociations: PhraseAssociation[] = [];
      const uniquePhrases: Set<string> = new Set();

      for (let j = 0; j < linePhraseAssociations.length; j++) {
        const phrase = linePhraseAssociations[j].phrase;
        
        // A phrase covers this section if:
        // 1. the phrase's start is less than this section's end
        // 2. the phrase's end is greater than this section's start
        //
        // i.e. fully contained, or overlapping on either side
        if (phrase.start < end && phrase.end > start) {
          phraseAssociations.push(linePhraseAssociations[j]);
          uniquePhrases.add(getPhraseKey(phrase));
        }
      }

      let pending = false;
      let spanType = TextSpanType.Text;
      let refCount = undefined;
      
      if (uniquePhrases.size === 1) {
        spanType = phraseAssociations[0].phrase.isRepeated ? TextSpanType.RepeatedPhrase : TextSpanType.Phrase;
        pending = phraseAssociations[0].phrase.isPending;
        
        if (spanType === TextSpanType.RepeatedPhrase) {
          refCount = phraseLinks[getPhraseKey(phraseAssociations[0].phrase)]?.size;
        }
      } else if (uniquePhrases.size > 1) {
        spanType = TextSpanType.OverlappingPhrases;
        pending = phraseAssociations.some(assn => assn.phrase.isPending);
      }

      const isShowingPendingBar = !!pendingPhrase || !!pendingRepeatedPhrase;

      const isSingleHovered = (spanType === TextSpanType.Phrase || spanType === TextSpanType.RepeatedPhrase) && hoveredPhraseKeys.has(getPhraseKey(phraseAssociations[0].phrase));
      const isMultiHovered = (spanType === TextSpanType.OverlappingPhrases) && phraseAssociations.some(assn => hoveredPhraseKeys.has(getPhraseKey(assn.phrase)));
      const isHovered = isSingleHovered || isMultiHovered;
      
      const isSingleClicked = (spanType === TextSpanType.Phrase || spanType === TextSpanType.RepeatedPhrase) && clickedPhraseKeys.has(getPhraseKey(phraseAssociations[0].phrase));
      const isMultiClicked = (spanType === TextSpanType.OverlappingPhrases) && phraseAssociations.some(assn => clickedPhraseKeys.has(getPhraseKey(assn.phrase)));
      const isClicked = isSingleClicked || isMultiClicked;

      const isDeemphasized = (!isHovered && hoveredPhraseKeys.size > 0) || (!pending && isShowingPendingBar);
      const isPending = pending || phraseAssociations.some(assn => assn.repetitionId === pendingPhraseRepetitionEditId);
      
      spans.push({
        start,
        end,
        phraseAssociations,
        spanType,
        isPending,
        isHoverable: spanType !== TextSpanType.Text,
        isClickable: isSpanClickable(spanType, pendingPhrase, pendingRepeatedPhrase),
        isContextable: isSpanContextable(spanType),
        isHovered,
        isClicked,
        isDeemphasized,
        displayRefCount: pending ? (refCount || 0) + 1 : refCount
      });
    }

    // determine styling for each span
    for (let i = 0; i < spans.length; i++) {
      const spanType = spans[i].spanType;
      const isLeftmostPhrase = spanType != TextSpanType.Text && (i === 0 || spans[i - 1].spanType === TextSpanType.Text);
      const isRightmostPhrase = spanType != TextSpanType.Text && (i === (spans.length - 1) || spans[i + 1].spanType === TextSpanType.Text);
      
      spans[i].classes = classnames(
        'text-span',
        spanType, // TextSpanType string enum values match class names
        { hoverable: spans[i].isHoverable },
        { clickable: spans[i].isClickable },
        { pending: spans[i].isPending },
        { hovered: spans[i].isHovered },
        { clicked: spans[i].isClicked },
        { deemphasized: spans[i].isDeemphasized },
        { leftmost: isLeftmostPhrase },
        { rightmost: isRightmostPhrase }
      );
    }

    return spans;
  }, [line, linePhraseAssociations, pendingPhrase, pendingRepeatedPhrase, pendingPhraseRepetitionEditId, isSpanClickable, hoveredPhraseKeys, clickedPhraseKeys]);

  const handleSpanClick = useCallback((event: React.MouseEvent, span: TextSpan): void => {
    event.stopPropagation();

    if (pendingPhrase && !pendingRepeatedPhrase) { 
      // replace pending repeated phrase
      setPendingRepeatedPhrase({ ...span.phraseAssociations[0].phrase, isPending: true });
    } else if (!pendingPhrase && pendingRepeatedPhrase) {
      // replace pending phrase
      setPendingPhrase({ ...span.phraseAssociations[0].phrase, isPending: true });
    } else if (span.isClicked) {
      setClickedPhraseKeys(new Set());
    } else {
      // select click
      const keys = new Set(span.phraseAssociations.flatMap(assn => {
        const phraseKey = getPhraseKey(assn.phrase);
        return [phraseKey, ...Array.from(phraseLinks[phraseKey] || new Set())];
      }));

      setClickedPhraseKeys(keys);
    }
  }, [pendingPhrase, pendingRepeatedPhrase, setPendingPhrase, setPendingRepeatedPhrase, setClickedPhraseKeys]);
  
  const handleSpanContext = useCallback((event: React.MouseEvent, span: TextSpan): void => {
    event.stopPropagation();
    if (event.preventDefault) event.preventDefault();

    if (span.spanType === TextSpanType.OverlappingPhrases) {
      setContextPhrase({
        transcriptLineIdx: span.phraseAssociations[0].phrase.transcriptLineIdx,
        start: span.start,
        end: span.end,
        isRepeated: false,
        isPending: true
      });
    } else {
      setContextPhrase(span.phraseAssociations[0].phrase);
    }
    setContextPhraseAssociations(span.phraseAssociations);

    if (pendingPhrase || pendingRepeatedPhrase) {
      showContextMenu({ event, id: TRANSCRIPT_SELECTION_MENU_ID });
    } else {
      showContextMenu({ event, id: PHRASE_EDIT_MENU_ID });
    }
  }, [pendingPhrase, pendingRepeatedPhrase, setContextPhrase, setContextPhraseAssociations, showContextMenu]);

  const handleSpanMouseOver = useCallback((span: TextSpan) => {
    const keys = new Set(span.phraseAssociations.flatMap(assn => {
      const phraseKey = getPhraseKey(assn.phrase);
      return [phraseKey, ...Array.from(phraseLinks[phraseKey] || new Set())];
    }));

    setHoveredPhraseKeys(new Set(keys));
  }, [setHoveredPhraseKeys, phraseLinks]);

  const handleSpanMouseOut = useCallback(() => {
    setHoveredPhraseKeys(new Set());
  }, [setHoveredPhraseKeys]);

  return (
    <div className={classnames('px-2 py-2 relative whitespace-pre-wrap', className)} style={style} {...attributes}>
      { textSpans.map(span => (
        <span
          key={`${span.start}:${span.end}`}
          className={span.classes}
          data-pls-idx={span.start}
          onMouseOver={span.isHoverable ? () => handleSpanMouseOver(span) : undefined}
          onMouseOut={span.isHoverable ? handleSpanMouseOut : undefined}
          onClick={span.isClickable ? event => handleSpanClick(event, span) : undefined}
          onContextMenu={span.isContextable ? event => handleSpanContext(event, span) : undefined}
        >
          { text.substring(span.start, span.end) }

          {/* Count Badge */}
          { span.spanType === TextSpanType.RepeatedPhrase && (span.displayRefCount || 0) > 1 &&
            <span
              data-pls-idx={span.end}
              className={classnames('count-badge', { pending: span.isPending })}
            >
              { span.displayRefCount }
            </span>
          }
        </span>
      )) }
    </div>
  );
};

export { HighlightableTextCell };
