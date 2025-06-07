import { CSSProperties } from 'react';

interface ManyToOneIconProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  width?: number;
  height?: number;
}

export const ManyToOneIcon: React.FC<ManyToOneIconProps> = ({ className, style, width, height = 16 }) => {
  return (
    <svg width={width} height={height} className={className} style={style} viewBox="0 0 100 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" fill="currentColor"
            markerWidth="6" markerHeight="6"
            orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>

      <rect x="3.5" y="2" width="28" height="15" rx="7" fill="currentColor" stroke="none" />
      <rect x="35" y="2" width="28" height="15" rx="7" fill="currentColor" stroke="none" />
      <rect x="66.5" y="2" width="28" height="15" rx="7" fill="currentColor" stroke="none" />

      <rect x="37.5" y="47" width="25" height="15" rx="7" fill="currentColor" stroke="none" />

      <line x1="17.5" y1="17" x2="45" y2="42" stroke="currentColor" marker-end="url(#arrow)" />
      <line x1="50" y1="17" x2="50" y2="41.5" stroke="currentColor" marker-end="url(#arrow)" />
      <line x1="80.5" y1="17" x2="55" y2="42" stroke="currentColor" marker-end="url(#arrow)" />
    </svg>
  );
};
