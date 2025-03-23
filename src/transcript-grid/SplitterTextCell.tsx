import { CSSProperties } from "react";
import classnames from "classnames";

import { getPhraseKey, Phrase, TranscriptLine } from "../data";

const phraseClasses = "rounded-xl bg-orange-200 whitespace-pre-wrap px-[5px] mx-[-5px]";
const repeatedClasses = "rounded-xl bg-blue-200 whitespace-pre-wrap px-[5px] mx-[-5px]";
const textClasses = "";

const generateTextAndPhrases = (text: string, sortedPhrases: Phrase[], offset: number = 0) => {
  const chunks = [];
  let chunkStartIndex = 0;

  sortedPhrases.forEach(phrase => {
    if (phrase.start === chunkStartIndex) {
      // phrase alone
      chunks.push(
        <span
          key={getPhraseKey(phrase)}
          className={phrase.isRepetition ? repeatedClasses : phraseClasses}
          data-pls-idx={phrase.start}
        >
          { text.substring(phrase.start, phrase.end) }
        </span>
      );
    } else {
      // preceeding plaintext chunk
      chunks.push(
        <span
          className={textClasses}
          data-pls-idx={chunkStartIndex}
        >
          { text.substring(chunkStartIndex, phrase.start) }
        </span>
      );

      // then the phrase
      chunks.push(
        <span
          key={getPhraseKey(phrase)}
          className={phrase.isRepetition ? repeatedClasses : phraseClasses}
          data-pls-idx={phrase.start}
          // onClick={() => { console.log('CLICKED!', phrase)}}
          // onMouseOver={() => console.log('MOUSE!', phrase) }
        >
          { text.substring(phrase.start, phrase.end) }
        </span>
      );
    }

    // advance just past this chunk
    chunkStartIndex = phrase.end;
  });

  if (chunkStartIndex < text.length) {
    // final non-highlighted chunk
    chunks.push(
      <span
        className={textClasses}
        data-pls-idx={chunkStartIndex}
      >
        { text.substring(chunkStartIndex) }
      </span>
    );
}

  return <> { chunks } </>;
};

interface SplitterTextCellProps {
  line: TranscriptLine;
  phrases?: Phrase[];
  maskIdx?: number | null;
  className?: string;
  style?: CSSProperties;
  attributes?: any;
}

const SplitterTextCell: React.FC<SplitterTextCellProps> = props => {
  const { line, phrases, maskIdx, className, style, attributes } = props;
  const isMasked = Number.isInteger(maskIdx);
  const text = line.textWithoutSpeaker || line.text;
  const cellStyles = isMasked ? 'flex' : 'px-2 py-2 relative';

  return (
    <div className={classnames(className, cellStyles)} style={style} {...attributes}>
      { !isMasked && !phrases?.length &&
        <span data-pls-idx="0">{ text }</span>
      }

      { !isMasked && phrases?.length && generateTextAndPhrases(text, phrases) }

      {/* TODO: generate correctly with mask offset */}
      { isMasked &&
        <>
        <div className="pl-2 py-2 inline-block whitespace-pre-wrap">{ text.substring(0, maskIdx as number) }</div>
        <div className="whitespace-pre-wrap grow-1 pr-2 py-2 inline-block bg-gray-200 text-gray-400 select-none cursor-not-allowed">
          { text.substring(maskIdx as number) }
        </div>
        </>
      }

    </div>
  );
};

export { SplitterTextCell };
