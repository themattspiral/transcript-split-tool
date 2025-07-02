import { CSSProperties } from 'react';
import classNames from 'classnames';

import { CustomCSSVariables, useViewState } from 'context/view-state-context';

interface CurverdArrowProps {
  size?: number;
  direction?: 'left-up' | 'down-right';
  mirrorX?: boolean;
  mirrorY?: boolean;
  color?: string;
  className?: string | undefined;
  style?: CSSProperties | undefined,
  mode?: 'general' | 'phrase-link'
}

const DownRightPath = 'M 5 0 V 20 C 5 45, 30 50, 42 50 H 42';
const LeftUpPath = 'M 72 60 H 47 C 22 60, 23 37.25, 23 30.5 V 30.5';

export const CurvedArrow: React.FC<CurverdArrowProps> = (props) => {
  const { size = 14, direction = 'down-right', mirrorX = false, mirrorY = false, color, style, mode = 'general', className } = props;

  const { cssVariables } = useViewState();
  const classes = classNames('curved-arrow', mode, { ['mirror-x']: mirrorX, ['mirror-y']: mirrorY }, className);
  const colorToUse = color || cssVariables[CustomCSSVariables.ColorStructureArrows];

  return (
    <svg className={classes} style={style} width={size} viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id={`arrowhead-${direction}`} markerWidth="6" markerHeight="4.5" refX="0" refY="2.25" orient={direction === 'left-up' ? '270' : 'auto'}>
          <polygon points="0 0, 3 2.25, 0 4.5" fill={colorToUse} />
        </marker>
      </defs>
      <path d={direction === 'left-up' ? LeftUpPath : DownRightPath} stroke={colorToUse} strokeWidth="10" fill="none" markerEnd={`url(#arrowhead-${direction})`} />
    </svg>
  );
};
