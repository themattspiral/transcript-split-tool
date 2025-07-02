import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripLinesVertical } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

import { useViewState } from 'context/view-state-context';
import { CustomCSSVariables } from 'context/view-state-context';
import { TranscriptGrid } from './transcript-grid';
import { StructureBuilder } from './structure-builder/structure-builder';

const RESIZE_ACTIVE_COLOR = 'red';
const RESIZE_COLUMN_WIDTH_PX = 7;
const STRUCTURE_BUILDER_MIN_WIDTH_PCT = 10;
const STRUCTURE_BUILDER_MAX_WIDTH_PCT = 50;

interface ResizeDetails {
  transcriptGridWidthPct: number;
  structureBuilderWidthPct: number;
}

interface ResizeContext {
  containerBoundingRect: DOMRect | null;
  isResizing: boolean;
}

interface TranscriptViewProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ className, style }) => {
  const { cssVariables } = useViewState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizeContext, setResizeContext] = useState<ResizeContext>({
    containerBoundingRect: null,
    isResizing: false
  });
  const [resizeDetails, setResizeDetails] = useState<ResizeDetails>({
    transcriptGridWidthPct: 80,
    structureBuilderWidthPct: 20
  });

  const spanBorderColor = cssVariables[CustomCSSVariables.ColorSpanBorder];
  const isResizingColor = resizeContext.isResizing ? RESIZE_ACTIVE_COLOR : spanBorderColor;

  const handleMouseDown = useCallback(() => {
    if (containerRef.current) {
      setResizeContext({
        containerBoundingRect: containerRef.current.getBoundingClientRect(),
        isResizing: true
      });
    }
  }, [containerRef, setResizeContext]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeContext.isResizing || !resizeContext.containerBoundingRect) return;
    
    const pxIntoRect = e.clientX - resizeContext.containerBoundingRect.x;
    const pxRemaining = resizeContext.containerBoundingRect.width - RESIZE_COLUMN_WIDTH_PX - pxIntoRect;

    const details: ResizeDetails = {
      transcriptGridWidthPct: (pxIntoRect / resizeContext.containerBoundingRect.width) * 100,
      structureBuilderWidthPct: (pxRemaining / resizeContext.containerBoundingRect.width) * 100
    };

    if (
      details.structureBuilderWidthPct >= STRUCTURE_BUILDER_MIN_WIDTH_PCT
      && details.structureBuilderWidthPct < STRUCTURE_BUILDER_MAX_WIDTH_PCT
    ) {
      setResizeDetails(details);
    }
  }, [resizeContext, setResizeDetails]);

  const handleMouseUp = useCallback(() => {
    setResizeContext(rc => ({ ...rc, isResizing: false }));
  }, [setResizeContext]);

  useEffect(() => handleMouseDown, [handleMouseDown]);

  useEffect(() => {
    if (resizeContext.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeContext, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={classNames('overflow-hidden flex grow-1 w-full', className)}
      style={style}
    >
      
      <TranscriptGrid
        className="h-full"
        style={{ width: `${resizeDetails.transcriptGridWidthPct}%` }}
      />

      {/* resize column */}
      <div
        className="h-full flex items-center justify-center relative select-none"
        style={{ width: `${RESIZE_COLUMN_WIDTH_PX}px`}}
      >
        {/* divider line */}
        <div
          className="h-full w-[1px] absolute"
          style={{ backgroundColor: isResizingColor }}
        />

        {/* resize handle box */}
        <div
          className="cursor-col-resize w-[20px] h-[30px] flex items-center justify-center absolute"
          style={{ color: isResizingColor }}
          onMouseDown={handleMouseDown}
        >
          <FontAwesomeIcon icon={faGripLinesVertical} className="fa-xl"  />
        </div>
      </div>

      <StructureBuilder
        className="h-full min-w-min"
        style={{ width: `${resizeDetails.structureBuilderWidthPct}%` }}
      />

    </div>
  );
};
