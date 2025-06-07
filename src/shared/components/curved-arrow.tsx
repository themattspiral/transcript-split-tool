import { CSSProperties } from 'react';
import classNames from 'classnames';

import { useViewState } from '../../context/view-state-context';
import { CustomCSSVariables } from '../../context/view-state-context';

interface CurverdArrowProps {
  size?: number;
  direction?: 'up' | 'down';
  color?: string;
  style?: CSSProperties | undefined,
  mode?: 'general' | 'phrase-link'
}

const DownPath = 'M 5 0 V 20 C 5 45, 30 50, 42 50 H 42';
const UpPath = 'M 72 60 H 47 C 22 60, 23 37.25, 23 30.5 V 30.5';

export const CurvedArrow: React.FC<CurverdArrowProps> = ({ size = 14, direction = 'down', color, style, mode = 'general' }) => {
  const { cssVariables } = useViewState();
  const classes = classNames('curved-arrow', { [mode]: mode !== 'general' });
  const colorToUse = color || cssVariables[CustomCSSVariables.ColorStructureArrows];

  return (
    <svg className={classes} style={style} width={size} viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id={`arrowhead-${direction}`} markerWidth="6" markerHeight="4.5" refX="0" refY="2.25" orient={direction === 'up' ? '270' : 'auto'}>
          <polygon points="0 0, 3 2.25, 0 4.5" fill={colorToUse} />
        </marker>
      </defs>
      <path d={direction === 'up' ? UpPath : DownPath} stroke={colorToUse} strokeWidth="10" fill="none" markerEnd={`url(#arrowhead-${direction})`} />
    </svg>
  );
};
