import { Menu, Item, Separator, Submenu } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import { ColumnDef } from "../data";

interface LinePartMenuProps {
  textSelectionString: string;
  columnId: string;
  groupColumnDefs: ColumnDef[];
  onRemove: () => void;
  onMove: (columnId: string) => void;
}

const LINE_PART_MENU_ID = 'line-part-menu-id';

const LinePartMenu: React.FC<LinePartMenuProps> = (props) => {
  const { textSelectionString, columnId, groupColumnDefs, onRemove, onMove } = props;
  const columnsExceptCurrent = groupColumnDefs.filter(def => def.id != columnId);
  const colDef = groupColumnDefs.find(def => def.id === columnId);

  return (
    <Menu id={LINE_PART_MENU_ID}>
      <Item disabled style={{ opacity: 1 }} className="font-medium">
        {textSelectionString}
      </Item>
      <Separator />
      <Item onClick={onRemove}>
        <div className="text-red-400 flex items-center">
          <FontAwesomeIcon icon={faXmark} className="mr-1" />
          Remove from {colDef?.label}
        </div>
      </Item>

      {columnsExceptCurrent?.length > 0 &&
        <Submenu label="Change Group">
          {columnsExceptCurrent.map(def => (
            <Item
              key={def.id}
              onClick={() => onMove(def.id)}
            >
              {def.label}
            </Item>
          ))}
        </Submenu>
      }
    </Menu>
  );
};

export { LINE_PART_MENU_ID, LinePartMenu };
