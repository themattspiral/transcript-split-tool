export interface ColumnDef {
  id: string;
  label: string;
}

export interface LinePart {
  start: number;
  end: number;
  columnId: string;
  text: string;
}
  
export interface TranscriptLine {
  lineNumber: string;
  text: string;
  author?: string;
  parts: LinePart[];
}

export interface GridClickState {
  columnId: string;
  transcriptLineNumber: number;
  textSelection?: Selection | null;
  textSelectionString?: string;
  linePartIdx?: number;
}

const sortByStart = (a: LinePart, b: LinePart): number => {
  if (a.start < b.start) {
    return -1;
  } else if (a.start > b.start) {
    return 1;
  } else if (a.end < b.end) {
    return -1;
  } else if (a.end > b.end) {
    return 1;
  } else {
    return 0;
  }
};

const addNewLinePart = (lines: TranscriptLine[], rowIdx: number, newPart: LinePart): TranscriptLine[] => {
  if (!Number.isInteger(rowIdx) || !newPart) {
    return lines;
  }

  const line: TranscriptLine = {
    lineNumber: lines[rowIdx].lineNumber,
    text: lines[rowIdx].text,
    author: lines[rowIdx].author,
    parts: [...lines[rowIdx].parts]
  };

  line.parts.push(newPart);
  line.parts.sort(sortByStart);
  
  return [
    ...lines.slice(0, rowIdx),
    line,
    ...(rowIdx + 1 < lines.length ? lines.slice(rowIdx + 1) : [])
  ];
};

const removeLinePart = (lines: TranscriptLine[], rowIdx: number, partIdx: number): TranscriptLine[] => {
  if (!Number.isInteger(rowIdx) || !Number.isInteger(partIdx)) {
    return lines;
  }

  const line: TranscriptLine = {
    lineNumber: lines[rowIdx].lineNumber,
    text: lines[rowIdx].text,
    author: lines[rowIdx].author,
    parts: [...lines[rowIdx].parts]
  };

  line.parts.splice(partIdx, 1);
  line.parts.sort(sortByStart);
  
  return [
    ...lines.slice(0, rowIdx),
    line,
    ...(rowIdx + 1 < lines.length ? lines.slice(rowIdx + 1) : [])
  ];
};

const updateLinePartGroup = (lines: TranscriptLine[], rowIdx: number, partIdx: number, newColumnId: string): TranscriptLine[] => {
  if (!Number.isInteger(rowIdx) || !Number.isInteger(partIdx) || !newColumnId) {
    return lines;
  }

  const line: TranscriptLine = {
    lineNumber: lines[rowIdx].lineNumber,
    text: lines[rowIdx].text,
    author: lines[rowIdx].author,
    parts: [...lines[rowIdx].parts]
  };

  line.parts[partIdx].columnId = newColumnId;
  
  return [
    ...lines.slice(0, rowIdx),
    line,
    ...(rowIdx + 1 < lines.length ? lines.slice(rowIdx + 1) : [])
  ];
};

const removeLinePartsForGroup = (lines: TranscriptLine[], columnId: string): TranscriptLine[] => {
  return lines.map(line => ({
    ...line,
    parts: line.parts.filter(part => part.columnId != columnId)
  }));
};

export { addNewLinePart, removeLinePart, updateLinePartGroup, removeLinePartsForGroup };
