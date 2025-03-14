import { Menu, Item, Separator } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import { ColumnDef } from "../data";

interface HeaderLinePartMenuProps {
  columnId: string;
  groupColumnDefs: ColumnDef[];
  onRename: (columnId: string) => void;
  onRemove: (columnId: string) => void;
}

const HEADER_LINE_PART_MENU_ID = 'header-line-part-menu-id';

const HeaderLinePartMenu: React.FC<HeaderLinePartMenuProps> = (props) => {
  const { columnId, groupColumnDefs, onRename, onRemove } = props;
  const colDef = groupColumnDefs.find(def => def.id === columnId);

  return (
    <Menu id={HEADER_LINE_PART_MENU_ID}>
      <Item onClick={() => onRename(colDef?.id || '?')}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
          Rename...
        </div>
      </Item>
      <Separator />
      <Item onClick={() => onRemove(colDef?.id || '?')}>
        <div className="text-red-400 flex items-center">
          <FontAwesomeIcon icon={faTrash} className="mr-1" />
          Delete {colDef?.label}
        </div>
      </Item>
    </Menu>
  );
};

export { HEADER_LINE_PART_MENU_ID, HeaderLinePartMenu };
