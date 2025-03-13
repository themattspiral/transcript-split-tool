import { DisplayTranscriptLine } from "./data"

interface SplitterTextCellProps {
  line: DisplayTranscriptLine;
}

const SplitterTextCell: React.FC<SplitterTextCellProps> = props => {
  const { line } = props;

  return (
    <div>
      {line.text}
    </div>
  );
};

export default SplitterTextCell;
