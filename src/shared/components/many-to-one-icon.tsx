import { CSSProperties } from 'react';

import { CustomCSSVariables, useViewState } from '../../context/view-state-context';

interface ManyToOneIconProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  width?: number;
  height?: number;
}

export const ManyToOneIcon: React.FC<ManyToOneIconProps> = ({ className, style, width, height = 16 }) => {
  const { cssVariables } = useViewState();
  const repColor = cssVariables[CustomCSSVariables.ColorRepetitionHeavy];
  const srcColor = cssVariables[CustomCSSVariables.ColorSourceHeavy];

  return (
    <svg width={width} height={height} className={className} style={style} viewBox="0 0 100 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" fill="currentColor"
            markerWidth="3" markerHeight="3"
            orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>

        <filter id="enhanceColor" x="0" y="0" width="100%" height="100%">
          <feColorMatrix type="saturate" values="2.0" />

          <feComponentTransfer>
            <feFuncR type="linear" slope="0.7" intercept="0" />
            <feFuncG type="linear" slope="0.7" intercept="0" />
            <feFuncB type="linear" slope="0.7" intercept="0" />
            <feFuncA type="identity" />
          </feComponentTransfer>
        </filter>
        
        <style>{`
          .dropdown-menu-option:hover {
            .block {
              fill: currentColor;
            }
            .line {
              stroke: currentColor;
            }
          }
          `}</style>
      </defs>

      <line x1="17.5" y1="20" x2="38" y2="41" className="line" strokeWidth="3" stroke="black" markerEnd="url(#arrow)" />
      <line x1="50" y1="20" x2="50" y2="40" className="line" strokeWidth="3" stroke="black" markerEnd="url(#arrow)" />
      <line x1="80.5" y1="20" x2="62" y2="41" className="line" strokeWidth="3" stroke="black" markerEnd="url(#arrow)" />

      <rect x="3.5" y="2" width="28" height="15" rx="7" className="block" fill={srcColor} stroke="none" filter="url(#enhanceColor)" />
      <rect x="35" y="2" width="28" height="15" rx="7" className="block" fill={srcColor} stroke="none" filter="url(#enhanceColor)" />
      <rect x="66.5" y="2" width="28" height="15" rx="7" className="block" fill={srcColor} stroke="none" filter="url(#enhanceColor)" />

      <rect x="37.5" y="47" width="25" height="15" rx="7" className="block" fill={repColor} stroke="none" filter="url(#enhanceColor)" />

    </svg>
  );
};
