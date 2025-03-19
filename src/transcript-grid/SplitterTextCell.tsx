import { CSSProperties } from "react";

import { TranscriptLine } from "../data";

interface SplitterTextCellProps {
  line: TranscriptLine;
  className?: string;
  style?: CSSProperties;
}

const SplitterTextCell: React.FC<SplitterTextCellProps> = props => {
  const { line, className, style } = props;

  return (
    <div className={className} style={style}>
      { line.textWithoutSpeaker || line.text }
    </div>
  );
};

export default SplitterTextCell;
