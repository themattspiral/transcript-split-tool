import { Menu, Item, Separator, Submenu } from "react-contexify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

import { ColumnDef } from "../data";

interface SplitTextMenuProps {
  textSelectionString: string;
  groupColumnDefs: ColumnDef[];
  onNewGroup: () => void;
  onExistingGroup: (columnId: string) => void;
}

const SPLIT_MENU_ID = 'split-menu-id';

const SplitTextMenu: React.FC<SplitTextMenuProps> = (props) => {
  const { textSelectionString, groupColumnDefs, onNewGroup, onExistingGroup } = props;

  return (
    <Menu id={SPLIT_MENU_ID} className="max-w-dvw">
      <Item disabled style={{ opacity: 1 }}>
        <div className="font-medium text-ellipsis overflow-hidden">
          {textSelectionString}
        </div>
      </Item>
      <Separator />
      <Item onClick={onNewGroup}>
        <div className="flex items-center">
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Create New Group...
        </div>
      </Item>

      {groupColumnDefs?.length > 0 &&
        <Submenu label={
          <div className="flex items-center">
            <FontAwesomeIcon icon={faRightFromBracket} className="mr-1" />
            Add to Existing Group
          </div>
          }
        >
          {groupColumnDefs.map(colDef => (
            <Item
              key={colDef.id}
              onClick={() => onExistingGroup(colDef.id)}
            >
              {colDef.label}
            </Item>
          ))}
        </Submenu>
      }
    </Menu>
  );
};

export { SPLIT_MENU_ID, SplitTextMenu };
